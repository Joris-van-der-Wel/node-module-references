'use strict';

var q = require('q');
var fs = require('q-io/fs');
var path = require('path');
var detective = require('detective').find;
var Transform = require('readable-stream').Transform;
var resolve = require('resolve');
var ownProp = ({}).hasOwnProperty;
var FilterParser = require('./FilterParser.js').Parser;

function filterFromExpression(expr)
{
        var parser = new FilterParser();
        
        return function(args)
        {
                var i;
                
                parser.yy.values = {};
                for (i = 0; i < args.length; ++i)
                {
                        parser.yy.values[args[i]] = true;
                }
                
                return parser.parse(expr);
        };
}

function ModuleReferencesStream(opts)
{
        var i;
        var filter;
        
        if (!opts)
        {
                opts = {};
        }
        
        if (!(this instanceof ModuleReferencesStream))
        {
                return new ModuleReferencesStream(opts);
        }
        
        Transform.call(this, { objectMode: true });
        
        this.resolve = opts.resolve || resolve;
        
        // Something streams module depencies to us (probably module-deps)
        // These are used to resolve reference annotations by parsing those javascript files, 
        // e.g. require('static-reference')('bla.css').
        // The entries might be in the wrong order, so make sure the order of require() is maintained,
        // for example:
        //      A.js : require('B.js'); require('static-reference')('A.css').
        //      B.js : require('static-reference')('B.css').
        // Should result in ['B.css', 'A.css']
        // This is important for things like equal specificity in CSS
        this._resolvedModulesDep = {};
        
        this._todo = {};
        
        // Used to prevent sending duplicates
        this._resolvedStaticDep = {};
        
        this.referencePackage = opts.referencePackage || 'static-reference';
        
        // false = do not read at all,
        // 'text' = text mode (utf8) (default)
        // 'binary' = binary using a Buffer
        this.readMode = opts.readMode === undefined ? 'text' : opts.readMode;
        
        this.filter = opts.filter || [];
        if (!Array.isArray(this.filter))
        {
                this.filter = [this.filter];
        }
        
        for (i = 0; i < this.filter.length; ++i)
        {
                filter = this.filter[i];
                
                if (typeof filter === 'function')
                {
                        continue;
                }
                
                if (typeof filter === 'string')
                {
                        this.filter[i] = filterFromExpression(filter);
                        continue;
                }
                
                throw Error('Invalid filter ' + i + ', it should be either a function or a string');
        }
}

module.exports = ModuleReferencesStream;
require('inherits')(ModuleReferencesStream, Transform);

function hasOwnPropAndEqual(object, key, value)
{
        return ownProp.call(object, key) && object[key] === value;
}

ModuleReferencesStream.prototype._transform = function(row, encoding, next)
{
        /* row is in the form of:
         * {"id":"somethingunique",
         *  "file":"/home/joris/foo/bar.js",
         *  "source":"console.log('hi!');",
         *  "deps": { "./foo": "anotheruniqueid" }
         * }
         */
        
        this._todo[row.id] = row;
        
        this._parseTodoList(false)
        .then(function() { next(); }, next) // success, catch
        .done();
};

ModuleReferencesStream.prototype._flush = function(done)
{
        this._parseTodoList(true)
        .then(function()
        {
                this.push(null);
        }.bind(this))
        .then(function() { done(); }, done) // success, catch
        .done();
};


function findRequireNodes(referencePackage, src)
{
        var requires;
        var i;
        var ret = [];

        requires = detective(src, { // might throw
                nodes: true
        });
        
        for (i = 0; i < requires.strings.length; ++i) 
        {
                if (requires.strings[i] === referencePackage)
                {
                        ret.push(requires.nodes[i]);
                }
        }
        
        return ret;
}

function findStaticDepsArguments(node)
{
        var call;
        var args = [], arg;
        var i;
        
        call = node.parent;
        if (!call || call.type !== 'CallExpression')
        {
                // The expression is not in the form of "require('static-reference')(...)"
                return null;
        }
        
        for (i = 0; i < call.arguments.length; ++i)
        {
                arg = call.arguments[i];
                
                if (arg.type !== 'Literal')
                {
                        // "require('static-reference')(1 + 2)", not valid
                        break;
                }
                
                args.push(arg.value.toString());
        }
        
        if (!args.length)
        {
                // "require('static-reference')()", also not vlaid
                return null;
        }
        
        return args;
}


ModuleReferencesStream.prototype._parseTodoList = function(doAll)
{
        var id, row;
        var promises = [];
        var didSomething;
        
        for (id in this._todo)
        {
                /* istanbul ignore if */
                if (!ownProp.call(this._todo, id))
                {
                        continue;
                }
                
                this._fixRecursiveDeps(id);
        }
        
        do
        {
                didSomething = false;
                
                for (id in this._todo)
                {
                        /* istanbul ignore if */
                        if (!ownProp.call(this._todo, id))
                        {
                                continue;
                        }

                        row = this._todo[id];

                        if (hasOwnPropAndEqual(this._resolvedModulesDep, id, true))
                        {
                                delete this._todo[id];
                                continue;
                        }

                        if (!doAll && !this._hasAllDeps(row))
                        {
                             continue;   
                        }

                        delete this._todo[id];
                        this._resolvedModulesDep[id] = true;
                        didSomething = true;
                        
                        promises.push(this._parseTodo(row));
                }
        }
        while (didSomething);
        
        return q.all(promises);
};

ModuleReferencesStream.prototype._parseTodo = function(row)
{
        var requireNodes, requireNode;
        var i;
        var args;
        var argPath;
        var resolve = q.denodeify(this.resolve).bind(this.resolve);
        var promises = [];
        
        requireNodes = findRequireNodes(this.referencePackage, row.source); // throws
        
        for (i = 0; i < requireNodes.length; ++i)
        {
                requireNode = requireNodes[i];
                
                args = findStaticDepsArguments(requireNode);
                
                if (!args)
                {
                        continue;
                }
                
                argPath = args[0];
                args[0] = path.extname(argPath).replace('.', ''); // foo.css -> css
                args.push(':'+path.basename(argPath)+':'); // foo.css -> :foo.css:
                
                if (!this._passesFilters(args))
                {
                        this.emit('filtered', row.file, argPath, args);
                        continue;
                }
                
                // some packages (such as browser-resolve) use the 'filename' key
                // others use 'basedir' (such as resolve)
                /* jshint -W083 */
                promises.push(
                        resolve(argPath, {filename: row.file, basedir: path.dirname(row.file)})
                        .then(function(fullpath)
                        {
                                if (!fullpath)
                                {
                                        throw Error('static dependency not found: "' + argPath + '" from file ' + row.file);
                                }

                                return this._parseStaticDep(fullpath);

                        }.bind(this))
                );
        }
        
        return q.all(promises);
};

ModuleReferencesStream.prototype._passesFilters = function(args)
{
        var i, filter;
        
        for (i = 0; i < this.filter.length; ++i)
        {
                filter = this.filter[i];
                if (!filter.call(this, args))
                {
                        return false;
                }
        }
        
        return true;
};

ModuleReferencesStream.prototype._parseStaticDep = function(fullpath)
{
        var id = fullpath;
        var readPromise;
        
        if (hasOwnPropAndEqual(this._resolvedStaticDep, id, true))
        {
                return;
        }
        
        this._resolvedStaticDep[id] = true;
        
        if (this.readMode)
        {
                readPromise = fs.read(fullpath, this.readMode === 'binary' ? 'rb' : 'r');
        }
        else
        {
                readPromise = q(function()
                {
                        return null;
                }).call();
        }
        
        return readPromise.then(function(source)
        {
                this.push({
                        id: id,
                        file: fullpath,
                        source: source,
                        deps: {}
                });
        }.bind(this));
};


ModuleReferencesStream.prototype._fixRecursiveDeps = function(parentID, parents)
{
        var row;
        var relpath;
        var childID;
        
        row = this._todo[parentID];
        
        if (!parents)
        {
                parents = [];
        }
        
        for (relpath in row.deps)
        {
                /* istanbul ignore if */
                if (!ownProp.call(row.deps, relpath))
                {
                        continue;
                }
                
                childID = row.deps[relpath];
                if (!childID || !this._todo[childID])
                {
                        continue;
                }
                
                // recursive dependency
                if (parents.indexOf(childID) >= 0)
                {
                        row.deps[relpath] = false;
                }
                else
                {
                        this._fixRecursiveDeps(childID, parents.concat([parentID]));
                }
        }
};

ModuleReferencesStream.prototype._hasAllDeps = function(row)
{
        var relpath;
        var id;
        
        for (relpath in row.deps)
        {
                /* istanbul ignore if */
                if (!ownProp.call(row.deps, relpath))
                {
                        continue;
                }
                
                id = row.deps[relpath];
                
                if (id && this._resolvedModulesDep[id] !== true)
                {
                        return false;
                }
        }
        
        return true;
};
