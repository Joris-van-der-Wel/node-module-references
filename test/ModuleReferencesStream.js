'use strict';

var path = require('path');
var ModuleReferencesStream = require('../lib/ModuleReferencesStream.js');
var fixturesDir = path.normalize(__dirname + '/fixtures/');

module.exports = {
        setUp: function(callback)
        {
                callback();
        },
        tearDown: function(callback)
        {
                callback();
        },
        'dummy method should do nothing': function(test)
        {
                test.ok(require('static-reference'));
                test.ok(require('static-reference')()()()());
                test.done();
        },
        'single node module file referring to 2 css files': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var dataCount = 0;
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                var barCssFile = fixturesDir + 'bar.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        ++dataCount;
                        if (dataCount === 1)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                        }
                        else if (dataCount === 2)
                        {
                                test.strictEqual(row.id, barCssFile);
                                test.strictEqual(row.file, barCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* bar.css */');
                        }
                        else
                        {
                                test.ok(false, 'Too many rows');
                        }
                
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(2 + 6 * 2);
                
                stream.end({
                        'id': 'blablabla',
                        'file': dummyFile,
                        'deps': {},
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                                + 'require("static-reference")("./bar.css");'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'a node module that depends on another (input is already in the correct order)': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var dataCount = 0;
                var fooJsFile = fixturesDir + 'foo.js'; // (does not actually exist)
                var barJsFile = fixturesDir + 'bar.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                var barCssFile = fixturesDir + 'bar.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        ++dataCount;
                        if (dataCount === 1)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                        }
                        else if (dataCount === 2)
                        {
                                test.strictEqual(row.id, barCssFile);
                                test.strictEqual(row.file, barCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* bar.css */');
                                
                                // _flush causes ModuleReferencesStream to output all remaining rows
                                // regardless of its depedencies,
                                // so do not end until we have received all the data we want to test
                                stream.end();
                        }
                        else
                        {
                                test.ok(false, 'Too many rows');
                        }
                
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(3 + 6 * 2);
                
                
                stream.write({
                        'id': fooJsFile,
                        'file': fooJsFile,
                        'deps': {},
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
                
                stream.write({
                        'id': barJsFile,
                        'file': barJsFile,
                        'deps': {'./foo' : fooJsFile},
                        'source': 'require("static-reference")("./bar.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'a node module that depends on another (input is in an incorrect order)': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var dataCount = 0;
                var fooJsFile = fixturesDir + 'foo.js'; // (does not actually exist)
                var barJsFile = fixturesDir + 'bar.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                var barCssFile = fixturesDir + 'bar.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        ++dataCount;
                        if (dataCount === 1)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                        }
                        else if (dataCount === 2)
                        {
                                test.strictEqual(row.id, barCssFile);
                                test.strictEqual(row.file, barCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* bar.css */');
                                
                                // _flush causes ModuleReferencesStream to output all remaining rows
                                // regardless of its depedencies,
                                // so do not end until we have received all the data we want to test
                                stream.end();
                        }
                        else
                        {
                                test.ok(false, 'Too many rows');
                        }
                
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(3 + 6 * 2);
                
                stream.write({
                        'id': barJsFile,
                        'file': barJsFile,
                        'deps': {'./foo' : fooJsFile},
                        'source': 'require("static-reference")("./bar.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
                
                stream.write({
                        'id': fooJsFile,
                        'file': fooJsFile,
                        'deps': {'somethingfalsy': false}, // false = filtered by module-deps
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'two node modules that depend on each other': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var fooJsFile = fixturesDir + 'foo.js'; // (does not actually exist)
                var barJsFile = fixturesDir + 'bar.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                var barCssFile = fixturesDir + 'bar.css';
                var receivedFoo = false;
                var receivedBar = false;
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        // order is undefined
                        
                        if (row.id === fooCssFile)
                        {
                                test.ok(!receivedFoo);
                                receivedFoo = true;
                                
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                                
                        }
                        else if (row.id === barCssFile)
                        {
                                test.ok(!receivedBar);
                                receivedBar = true;
                                
                                test.strictEqual(row.id, barCssFile);
                                test.strictEqual(row.file, barCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* bar.css */');
                        }
                        else
                        {
                                test.ok(false, 'Unknown row');
                        }
                        
                        // _flush causes ModuleReferencesStream to output all remaining rows
                        // regardless of its depedencies,
                        // so do not end until we have received all the data we want to test
                        if (receivedFoo && receivedBar)
                        {
                                stream.end();
                        }
                });
                
                stream.on('end', function()
                {
                        test.ok(receivedFoo);
                        test.ok(receivedBar);
                        test.done();
                });
                
                test.expect(4 + 7 * 2);
                
                stream.write({
                        'id': fooJsFile,
                        'file': fooJsFile,
                        'deps': {'./bar' : barJsFile},
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
                
                stream.write({
                        'id': barJsFile,
                        'file': barJsFile,
                        'deps': {'./foo' : fooJsFile},
                        'source': 'require("static-reference")("./bar.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                }); 
        },
        'three node modules that depend on each other': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var fooJsFile = fixturesDir + 'foo.js'; // (does not actually exist)
                var barJsFile = fixturesDir + 'bar.js'; // (does not actually exist)
                var bazJsFile = fixturesDir + 'baz.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                var barCssFile = fixturesDir + 'bar.css';
                var bazCssFile = fixturesDir + 'baz.css';
                var receivedFoo = false;
                var receivedBar = false;
                var receivedBaz = false;
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        // order is undefined
                        
                        if (row.id === fooCssFile)
                        {
                                test.ok(!receivedFoo);
                                receivedFoo = true;
                                
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                        }
                        else if (row.id === barCssFile)
                        {
                                test.ok(!receivedBar);
                                receivedBar = true;
                                
                                test.strictEqual(row.id, barCssFile);
                                test.strictEqual(row.file, barCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* bar.css */');
                        }
                        else if (row.id === bazCssFile)
                        {
                                test.ok(!receivedBaz);
                                receivedBaz = true;
                                
                                test.strictEqual(row.id, bazCssFile);
                                test.strictEqual(row.file, bazCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* baz.css */');
                        }
                        else
                        {
                                test.ok(false, 'Unknown row');
                        }
                        
                        if (receivedFoo && receivedBar && receivedBaz)
                        {
                                stream.end();
                        }
                });
                
                stream.on('end', function()
                {
                        test.ok(receivedFoo);
                        test.ok(receivedBar);
                        test.ok(receivedBaz);
                        test.done();
                });
                
                test.expect(3 + 8 * 3);
                
                stream.write({
                        'id': fooJsFile,
                        'file': fooJsFile,
                        'deps': {'./bar' : barJsFile},
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
                
                stream.write({
                        'id': barJsFile,
                        'file': barJsFile,
                        'deps': {'./baz' : bazJsFile},
                        'source': 'require("static-reference")("./bar.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
                
                stream.write({
                        'id': bazJsFile,
                        'file': bazJsFile,
                        'deps': {'./foo' : fooJsFile},
                        'source': 'require("static-reference")("./baz.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                }); 
        },
        'a node modules that depends on itself': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var fooJsFile = fixturesDir + 'foo.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        // order is undefined
                        
                        if (row.id === fooCssFile)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                                
                                stream.end();
                        }
                        else
                        {
                                test.ok(false, 'Unknown row');
                        }
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(2 + 6 * 1);
                
                stream.write({
                        'id': fooJsFile,
                        'file': fooJsFile,
                        'deps': {'./foo' : fooJsFile},
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'referring to the css file multiple times': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var dataCount = 0;
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        ++dataCount;
                        if (dataCount === 1)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                        }
                        else
                        {
                                test.ok(false, 'Too many rows');
                        }
                
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(4 + 6 * 1);
                
                var row = {
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                                + 'require("static-reference")("./foo.css");'
                                + 'require("static-reference")("./foo.css");'
                };
                
                stream.write(row, null, function() { test.ok(true); });
                stream.write(row, null, function() { test.ok(true); });
                stream.end(row, null, function() { test.ok(true); });
        },
        'a module without references': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        test.ok(false, 'Too many rows');
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(2);
                
                stream.end({
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': 'require("somethingelse")("./bar.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'invalid references': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        test.ok(false, 'Too many rows');
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(2);
                
                stream.end({
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': 'throw Error("Do not run me");\n'
                                + 'require("somethingelse")("./bar.css");\n'
                                + 'require("static-reference");\n' // without further args, should be ignored
                                + 'require("static-reference")("./fo"+"o.css");\n' // not a literal, should be ignored
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'reference to an invalid file': function(test)
        {
                var stream = ModuleReferencesStream();
                
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                
                stream.on('error', function(error)
                {
                        test.ok(error);
                        test.ok(error instanceof Error);
                        test.done();
                });
                
                stream.on('data', function(row)
                {
                        test.ok(false, 'Too many rows');
                });
                
                stream.on('end', function()
                {
                        test.ok(false);
                        test.done();
                });
                
                test.expect(2);
                
                stream.end({
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': 'throw Error("Do not run me");\n'
                                + 'require("static-reference")("./thisfiledoesnotexist.css")\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'reference to an invalid file, using a resolver that does not throw for us': function(test)
        {
                function resolver(path, opts, callback)
                {
                        var resolve = require('resolve');
                        test.ok(true);
                        
                        resolve(path, opts, function(err, result)
                        {
                                test.ok(err);
                                test.ok(!result);
                                // eat the error
                                callback(null, null);
                        });
                }
                
                var stream = ModuleReferencesStream({resolve: resolver});
                
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                
                stream.on('error', function(error)
                {
                        test.ok(error);
                        test.ok(error instanceof Error);
                        test.done();
                });
                
                stream.on('data', function(row)
                {
                        test.ok(false, 'Too many rows');
                });
                
                stream.on('end', function()
                {
                        test.ok(false);
                        test.done();
                });
                
                test.expect(5);
                
                stream.end({
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': 'throw Error("Do not run me");\n'
                                + 'require("static-reference")("./thisfiledoesnotexist.css")\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'no input at all': function(test)
        {
                var stream = ModuleReferencesStream();
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        test.ok(false, 'Too many rows');
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(2);
                
                stream.end(undefined, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'readMode = false': function(test)
        {
                var stream = ModuleReferencesStream({readMode: false});
                
                var dataCount = 0;
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                var barCssFile = fixturesDir + 'bar.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        ++dataCount;
                        if (dataCount === 1)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source === null);
                        }
                        else if (dataCount === 2)
                        {
                                test.strictEqual(row.id, barCssFile);
                                test.strictEqual(row.file, barCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source === null);
                        }
                        else
                        {
                                test.ok(false, 'Too many rows');
                        }
                
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(2 + 5 * 2);
                
                stream.end({
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                                + 'require("static-reference")("./bar.css");'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'readMode = binary': function(test)
        {
                var stream = ModuleReferencesStream({readMode: 'binary'});
                
                var dataCount = 0;
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        ++dataCount;
                        if (dataCount === 1)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.ok(Buffer.isBuffer(row.source));
                                test.strictEqual(row.source.toString('utf8', 0, 13), '/* foo.css */');
                        }
                        else
                        {
                                test.ok(false, 'Too many rows');
                        }
                
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(2 + 7 * 1);
                
                stream.end({
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': 'require("static-reference")("./foo.css"); throw Error("Do not run me");\n'
                }, 
                null, 
                function()
                {
                        test.ok(true);
                });
        },
        'filter callback': function(test)
        {
                var stream = ModuleReferencesStream({
                        filter: function(args)
                        {
                                test.ok(args.indexOf('css') >= 0);
                                return args.indexOf('abc') >= 0;
                        }
                });
                
                var dataCount = 0;
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        ++dataCount;
                        if (dataCount === 1)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                        }
                        else
                        {
                                test.ok(false, 'Too many rows');
                        }
                
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(4 + 6 * 1 + 3);
                
                var row = {
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': ' throw Error("Do not run me");\n'
                                + 'require("static-reference")("./foo.css", "abc", "def");'
                                + 'require("static-reference")("./bar.css", "def");'
                                + 'require("static-reference")("./foo.css", "abc");'
                };
                
                stream.write(row, null, function() { test.ok(true); });
                stream.write(row, null, function() { test.ok(true); });
                stream.end(row, null, function() { test.ok(true); });
        },
        'filter expression': function(test)
        {
                var stream = ModuleReferencesStream({
                        filter: 'css && abc && !:bar.css:'
                });
                
                var dataCount = 0;
                var dummyFile = fixturesDir + 'dummy.js'; // (does not actually exist)
                var fooCssFile = fixturesDir + 'foo.css';
                
                stream.on('error', function(error)
                {
                        console.log('Error in stream', error, error && error.stack);
                        test.ok(false, 'An error occured within the stream');
                        test.done();   
                });
                
                stream.on('data', function(row)
                {
                        ++dataCount;
                        if (dataCount === 1)
                        {
                                test.strictEqual(row.id, fooCssFile);
                                test.strictEqual(row.file, fooCssFile);
                                test.ok(row.deps);
                                test.strictEqual(Object.keys(row.deps).length, 0);
                                test.ok(row.source);
                                test.strictEqual(row.source.substr(0, 13), '/* foo.css */');
                        }
                        else
                        {
                                test.ok(false, 'Too many rows');
                        }
                
                });
                
                stream.on('end', function()
                {
                        test.ok(true);
                        test.done();
                });
                
                test.expect(4 + 6 * 1);
                
                var row = {
                        'id': dummyFile,
                        'file': dummyFile,
                        'deps': {},
                        'source': ' throw Error("Do not run me");\n'
                                + 'require("static-reference")("./foo.css", "abc", "def");'
                                + 'require("static-reference")("./bar.css", "def");'
                                + 'require("static-reference")("./foo.css", "abc");'
                                + 'require("static-reference")("./bar.css", "abc");'
                };
                
                stream.write(row, null, function() { test.ok(true); });
                stream.write(row, null, function() { test.ok(true); });
                stream.end(row, null, function() { test.ok(true); });
        },
        'filter invalid': function(test)
        {
                test.throws(function()
                {
                        ModuleReferencesStream({
                                filter: ['css', {'this should fail': 'ya!'}]
                        });
                }, Error);
                test.done();
        }
};