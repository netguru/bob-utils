const assertOrThrow = require('../../AssertOrThrow');

module.exports = async (check, error, ...args) => {
  const value = await check(...args);
  assertOrThrow(value, error);
};
