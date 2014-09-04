'use strict';

var util = require('util');
var jison = require('jison');

var grammar = {
        'lex': {
                'rules': [
                        // VAR may contain whitespace within but not leading/trailing
                        ['[^&|!()=\\s][^&|!()=]*[^&|!()=\\s]', 'return "VAR";'    ],
                        ['\\s+'                           , '/* whitespace */' ],
                        ['=='                             , 'return "==";'     ],
                        ['!='                             , 'return "!=";'     ],
                        ['&&'                             , 'return "&&";'     ],
                        ['\\|\\|'                         , 'return "||";'     ],
                        ['!'                              , 'return "!";'      ],
                        ['\\('                            , 'return "(";'      ],
                        ['\\)'                            , 'return ")";'      ],
                        ['$'                              , 'return "EOF";'    ]
                ]
        },
        'operators': [
                // same order as javascript
                ['left', '||'],
                ['left', '&&'],
                ['left', '==', '!='],
                ['right', '!']
        ],
        'bnf': {
                'expressions' : [['e EOF', 'return $1;']],
                'e': [
                        ['e == e', '$$ = $1 === $3;'          ],
                        ['e != e', '$$ = $1 !== $3;'          ],
                        ['e && e', '$$ = $1 && $3;'           ],
                        ['e || e', '$$ = $1 || $3;'           ],
                        ['! e'   , '$$ = !$2;'                ],
                        ['( e )' , '$$ = $2;'                 ],
                        ['VAR'   , '$$ = getVar(yy, yytext);' ]
                ]
        }
};

function moduleMain(argv)
{
        var parser;
        var i;
        
        if (!argv[1])
        {
                console.log('Usage: '+require('path').basename(argv[0])+' EXPRESSION KEYWORDS');
                process.exit(1);
        }
        
        parser = new exports.Parser();
        parser.yy.values = {};
        for (i = 2; i < argv.length; ++i)
        {
                parser.yy.values[argv[i]] = true;
        }
        
        require('util').puts(parser.parse(argv[1]));
}

var parser = new jison.Parser(grammar);
util.puts('var ownProp = ({}).hasOwnProperty;');
util.puts('function getVar(yy, name) { name = name.trim(); return !!(ownProp.call(yy.values, name) && yy.values[name]); };');
util.puts(parser.generate({moduleMain: moduleMain}));