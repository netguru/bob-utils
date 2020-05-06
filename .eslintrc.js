module.exports = {
  extends: ['prettier'],
  plugins: ['chai-friendly', 'prettier'],
  parser: 'babel-eslint',
  env: {
    mocha: true,
    node: true,
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': [2, { vars: 'all', args: 'after-used', argsIgnorePattern: '^_' }],
    'no-console': ['error', { allow: ['error'] }],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
  },
};
