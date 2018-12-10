const chai = require('chai');
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

const { expect } = chai;

const RespondMultiplexer = require('../src/RespondMultiplexer');
const BotResponseError = require('../src/BotResponseError');

const responseMock = {
  send: message => message,
};

describe('RespondMultiplexer test suite', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should execute proper action', async () => {
    const multiplexer = new RespondMultiplexer();

    multiplexer.addResponse(/abc/, () => 1);
    multiplexer.addResponse(/bcd/, () => 2);

    const action = multiplexer.choose('abc');

    const result = await action.exec();

    expect(result).to.eql(1);
  });

  it('should execute pre-built default action', async () => {
    const multiplexer = new RespondMultiplexer();

    multiplexer.addResponse(/abc/, () => 1);
    multiplexer.addResponse(/bcd/, () => 2);

    const action = multiplexer.choose('def');

    const result = await action.exec();

    expect(result).to.eql(undefined);
  });

  it('should execute user default action', async () => {
    const multiplexer = new RespondMultiplexer();

    multiplexer.addResponse(/abc/, () => 1);
    multiplexer.addResponse(/bcd/, () => 2);
    multiplexer.setDefaultResponse(() => 3);

    const action = multiplexer.choose('def');

    const result = await action.exec();

    expect(result).to.eql(3);
  });

  it('should should log unexpected error and respond with default error message', async () => {
    const defaultMessage = 'abc';

    const multiplexer = new RespondMultiplexer();
    multiplexer.setDefaultUserErrorMessage(defaultMessage);

    const loggerStub = sinon.stub(multiplexer, 'logError').returns();
    const responseSpy = sinon.stub(responseMock, 'send');

    multiplexer.addResponse(/abc/, () => Promise.reject(new Error('error')));
    multiplexer.addResponse(/bcd/, () => 2);
    multiplexer.setDefaultResponse(() => 3);

    const action = multiplexer.choose('abc');

    await action.exec(responseMock);

    expect(responseSpy.calledOnceWithExactly(defaultMessage)).to.equal(true);
    expect(loggerStub.calledOnce).to.equal(true);
  });

  it('should not log the expected error and respond with that message', async () => {
    const errorUserMessage = 'abcd';

    const multiplexer = new RespondMultiplexer();

    const loggerStub = sinon.stub(multiplexer, 'logError').returns();
    const responseSpy = sinon.stub(responseMock, 'send');

    multiplexer.addResponse(/abc/, () => Promise.reject(new BotResponseError('error', errorUserMessage)));
    multiplexer.addResponse(/bcd/, () => 2);
    multiplexer.setDefaultResponse(() => 3);

    const action = multiplexer.choose('abc');

    await action.exec(responseMock);

    expect(responseSpy.calledOnceWithExactly(errorUserMessage)).to.equal(true);
    expect(loggerStub.notCalled).to.equal(true);
  });
});
