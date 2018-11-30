const chai = require('chai');

const { expect } = chai;
const assertOrThrow = require('../src/AssertOrThrow');

describe('AssertOrThrow test suite', () => {
  it('should throw error when assertion fails', () => {
    const fun = () => assertOrThrow(1 + 1 === 3, new Error('Hello error'));
    expect(fun).to.throw(Error, 'Hello error');
  });

  it('should not throw error when assertion passes', () => {
    const fun = () => assertOrThrow(1 + 1 === 2, new Error('Hello error'));
    expect(fun).to.not.throw();
  });
});
