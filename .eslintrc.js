module.exports = {
    extends: 'airbnb-base',
    parserOptions: {
        ecmaVersion: 2021
    },
    rules: {
        indent: ['error', 4, {
            SwitchCase: 1,
            VariableDeclarator: 1,
            outerIIFEBody: 1,
            // MemberExpression: null,
            FunctionDeclaration: {
                parameters: 1,
                body: 1
            },
            FunctionExpression: {
                parameters: 1,
                body: 1
            },
            CallExpression: {
                arguments: 1
            },
            ArrayExpression: 1,
            ObjectExpression: 1,
            ImportDeclaration: 1,
            flatTernaryExpressions: false,
            ignoreComments: false
        }],
        'comma-dangle': ['error', 'never'],
        'max-len': 'off',
        'no-plusplus': 'off',
        'no-param-reassign': 'off',
        'no-console': 'off'
    }
};
