const chai = require('chai');
chai.use(require('chai-as-promised'));

const { expect } = chai;
const asyncAssertOrThrow = require('../src/AsyncAssertOrThrow');

const dummy = value => value;

const asyncDummy = async value => value;

describe('AsyncAssertOrThrow test suite', () => {
  it('Should invoke a function and throw an error', async () => {
    const error = new Error('dummy');
    await expect(asyncAssertOrThrow(dummy, error, false)).to.be.rejectedWith(error);
  });

  it('Should invoke a async function and throw an error', async () => {
    const error = new Error('dummy');
    await expect(asyncAssertOrThrow(asyncDummy, error, false)).to.be.rejectedWith(error);
  });

  it('Should invoke a function and NOT throw an error', async () => {
    const error = new Error('dummy');
    await expect(asyncAssertOrThrow(dummy, error, true)).to.not.be.rejectedWith(error);
  });

  it('Should invoke a async function and NOT throw an error', async () => {
    const error = new Error('dummy');
    await expect(asyncAssertOrThrow(asyncDummy, error, true)).to.not.be.rejectedWith(error);
  });
});
