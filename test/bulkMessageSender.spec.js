const { expect } = require('chai');
const sinon = require('sinon');
const faker = require('faker');
const rollbar = require('rollbar');

const loggerClientMock = { error: () => {} };
const slackClientMock = { chat: { postMessage: () => {} } };

const BulkMessageSender = require('../src/BulkMessageSender');

describe('BulkMessageSender test suite', () => {
  let channels;
  let sender;

  before(() => {
    channels = Array.from(new Array(4), faker.hacker.noun);
  });

  beforeEach(() => {
    sinon.stub(BulkMessageSender, 'delayAction').resolves();
    sender = new BulkMessageSender(channels, loggerClientMock, slackClientMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('sends message to appropiate channels', async () => {
    const postMessageSpy = sinon.spy(slackClientMock.chat, 'postMessage');

    await sender.bulkSendMessage('foo');

    expect(postMessageSpy.callCount).to.be.equal(channels.length);
  });

  it('returns BulkMessageSender instance via static method', () => {
    const newSender = BulkMessageSender.create(
      sender.channels,
      sender.loggerClientMock,
      slackClientMock,
    );

    expect(newSender.channels).to.deep.equal(sender.channels);
    expect(newSender.loggerClientMock).to.deep.equal(sender.loggerClientMock);
    expect(newSender.slackClientMock).to.deep.equal(sender.slackClientMock);
  });

  it('sends messages even if some of them were failured and forwards error to rollbar', async () => {
    const postMessageStub = sinon.stub(slackClientMock.chat, 'postMessage').rejects();
    const rollbarErrorSpy = sinon.stub(rollbar, 'error');

    await sender.bulkSendMessage('foo');

    expect(postMessageStub.callCount).to.be.equal(channels.length);
    expect(rollbarErrorSpy.callCount).to.be.equal(channels.length);
  });

  it('gathers appropiate statistics', async () => {
    const postMessageStub = sinon
      .stub(slackClientMock.chat, 'postMessage')
      .callsFake(() => (postMessageStub.callCount % 2 ? Promise.resolve() : Promise.reject(new Error('Failed'))));

    const statistics = await sender.bulkSendMessage('foo');

    expect(postMessageStub.callCount).to.be.equal(channels.length);
    expect(statistics.sent).has.lengthOf(2);
    expect(statistics.notSent).has.lengthOf(2);
  });

  it('waits appropiate amount of time between message sends', async () => {
    BulkMessageSender.delayAction.restore();
    const timeoutStub = sinon.stub(global, 'setTimeout').callsFake(fn => fn());

    await sender.bulkSendMessage('foo');

    expect(timeoutStub.callCount).to.be.equal(channels.length);
  });
});
