module-references
=================
Annotate file references within the source code of your node packages. These references can be scanned for using the dependency graph of a module. This package takes input from [module-deps](https://www.npmjs.org/package/module-deps) and generates a list of all the references (in the same format as module-deps).


reference annotation
--------------------
Reference annotations are created by placing a require call to a dummy package in your source code. This dummy package does nothing at run-time: 

```javascript
require('static-reference')('./foo.css');
require('static-reference')("./foo.less");
require('static-reference')('./foo-mobile.css', 'filter keyword', 'another filter keyword');
```
These require calls are scanned for by statically analyzing your source code. Therefore, only a string literal will work properly, for example `require('static-reference')('./foo' + '.css');` will be ignored.

This module gives you a list of all the referenced files. The first argument to a reference annotation is the file path relative to the module that contains it (it uses the same algorithm as `require.resolve()`), all other arguments serve as keywords that you can filter on. 


example
-------

```javascript
var ModuleReferencesStream = require('module-references');
var stream = new ModuleReferencesStream({
    filter: 'css',
    readMode: 'text'
});
stream.pipe(require('JSONStream').stringify()).pipe(process.stdout);
stream.write({
    'id': 'unique id for foo.js',
    'file': '/absolute/path/foo.js',
    'deps': {'./bar.js' : 'unique id for bar'},
    'source': 'require("static-reference")("./foo.css"); otherJavascriptCode();'
});
stream.end({
    'id': 'unique id for bar.js',
    'file': '/absolute/path/bar.js',
    'deps': {},
    'source': 'require("static-reference")("./bar.css"); someMoreJavascriptCode();'
});

```

This would give you the following output (assuming foo.css and bar.css exist):
```javascript
[{
    'id': 'unique id for bar.css',
    'file': '/absolute/path/bar.css',
    'source': 'body { background: red; }'
},
{
    'id': 'unique id for foo.css',
    'file': '/absolute/path/foo.css',
    'source': 'p { margin: 20px; }'
}]
```

api
---
```javascript
var ModuleReferencesStream = require('module-references');
```

var stream = ModuleReferencesStream(opts={})
--------------------------------------------
Return an object transform `stream` that expects output from module-deps and produces objects for each unique reference found.

Optionally pass in some `opts`:

* `opts.readMode` - Read the referenced files as `'binary'` or as `'text'`. Passing `false` disables reading of the referenced files
* `opts.filter` - A function (or an array of functions)  that should return false if the referenced file should be skipped. Its only argument is an array of filter keywords that were present in the annotation. e.g. `function(args) { return args.indexOf('mobile-css') >= 0; }`
* `opts.filter` - Or, a filter may be defined as a string. In this case it is compiled as a simple boolean expression


filter syntax
-------------
If you pass a filter as a string (useful for CLI's) it is compiled as a boolean expression that is very similar to javascript.

It supports the operators `&&`, `||`, `!`, `==`, `!=` as well as grouping `()`. These operators have the same function and precedence as in javascript. Such an expression is evaluated upon the given arguments and file extension in a reference annotation. Each argument is interpreted as a boolean, the argument is either present (`true`) or not present (`false`).

`"css && abc && (def || ghj)"` will match both 
```javascript
require('static-reference')('./bla.css', 'abc', 'def');
```
and
```javascript
require('static-reference')('./bla.css', 'abc', 'ghj');
```

install
-------
With [npm](http://npmjs.org), to get the module do:

```
npm install module-deps
```

license
-------
MIT