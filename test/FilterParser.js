'use strict';

var FilterParser = require('../lib/FilterParser.js').Parser;

module.exports = {
        setUp: function(callback)
        {
                var parser = this.parser = new FilterParser();
                this.parser.yy.values = {'true': true};
                
                this.dotest = function(str, expected)
                {
                        this.strictEqual(parser.parse(str), expected, str + ' should be ' + expected);
                };
                
                callback();
        },
        tearDown: function(callback)
        {
                callback();
        },
        'single operator': function(test)
        {
                var dotest = this.dotest.bind(test);
                
                // false is not defined and therefor really false
                dotest('false', false);
                dotest('true' , true );
                
                dotest('false == false', false === false);
                dotest('false == true' , false === true );
                dotest('true  == false', true  === false);
                dotest('true  == true' , true  === true );
                
                dotest('false != false', false !== false);
                dotest('false != true' , false !== true );
                dotest('true  != false', true  !== false);
                dotest('true  != true' , true  !== true );
                
                dotest('false && false', false && false);
                dotest('false && true' , false && true );
                dotest('true  && false', true  && false);
                dotest('true  && true' , true  && true );
                
                dotest('false || false', false || false);
                dotest('false || true' , false || true );
                dotest('true  || false', true  || false);
                dotest('true  || true' , true  || true );
                
                dotest(' !false' , !false );
                dotest('   !true'  , !true  );
                dotest('! !false', !!false);
                dotest(' ! ! true' , !!true );
                
                test.done();
        },
        'operator precedence': function(test)
        {
                var dotest = this.dotest.bind(test);
                
                // (all of them should result in true)
                dotest('false == false || true', false === false || true);
                dotest('true || false == false', true || false === false);
                dotest('true || false != true', true || false !== true);
                dotest('true != false || true', true !== false || true);
                dotest('!false || true', !false || true);
                dotest('true || false && false', true || false && false);
                dotest('false && true || true', false && true || true);
                
                // (all of them should result in false)
                dotest('false == (false || true)', false === (false || true));
                dotest('(true || false) == false', (true || false) === false);
                dotest('(true || false) != true', (true || false) !== true);
                dotest('true != (false || true)', true !== (false || true));
                dotest('!(false || true)', !(false || true));
                dotest('(true || false) && false', (true || false) && false);
                dotest('false && (true || true)', false && (true || true));
                test.done();
        },
        'variable names': function(test)
        {
                var dotest = this.dotest.bind(test);
                
                this.parser.yy.values.abc = true;
                this.parser.yy.values.def = true;
                this.parser.yy.values['name with.weird chars*'] = true;
                
                dotest('abc && def', true);
                dotest('abc == def', true);
                dotest('abc || notpresent', true);
                dotest('abc && notpresent', false);
                
                dotest('abc && name with.weird chars*', true);
                
                test.done();
        },
        'invalid expression': function(test)
        {
                test.throws(function()
                {
                        this.parser.parse('&&');
                }.bind(this), Error);
                
                test.throws(function()
                {
                        this.parser.parse('');
                }.bind(this), Error);
                
                
                test.done();
        }
};