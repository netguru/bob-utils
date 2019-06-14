const chai = require('chai');
const sinon = require('sinon');

const { expect } = chai;
const assertOrSendAndThrow = require('../src/AssertOrSendAndThrow');

const res = {
  status: () => ({
    json: () => {},
  }),
};

describe('AssertOrSendAndThrow test suite', () => {
  const assert = assertOrSendAndThrow(res)(400);

  afterEach(() => {
    sinon.restore();
  });

  it('should send message and throw error when assertion fails', () => {
    const responseSpy = sinon.spy(res, 'status');
    const fun = () => assert(1 + 1 === 3, new Error('Hello error'));
    expect(fun).to.throw('Hello error');
    expect(responseSpy.calledOnce).to.equal(true);
  });

  it('should not throw error when assertion passes', () => {
    const responseSpy = sinon.spy(res, 'status');
    const fun = () => assertOrSendAndThrow(1 + 1 === 2, new Error('Hello error'));
    expect(fun).to.not.throw();
    expect(responseSpy.calledOnce).to.equal(false);
  });
});
