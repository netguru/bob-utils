const { expect } = require('chai');
const sinon = require('sinon');

const slackClientMock = { chat: { postMessage: () => {} } };

const BulkMessageSender = require('../src/BulkMessageSender');

describe('BulkMessageSender test suite', () => {
  let channels;
  let sender;

  before(() => {
    channels = ['channel-1', 'channel-2', 'channel-3', 'channel-4'];
  });

  beforeEach(() => {
    sinon.stub(BulkMessageSender, 'delayAction').resolves();
    sender = new BulkMessageSender(channels, slackClientMock);
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
    const newSender = BulkMessageSender.create(sender.channels, slackClientMock);

    expect(newSender.channels).to.deep.equal(sender.channels);
    expect(newSender.slackClientMock).to.deep.equal(sender.slackClientMock);
  });

  it('gathers all occuring errors within given channels', async () => {
    sinon.stub(slackClientMock.chat, 'postMessage').rejects();

    await sender.bulkSendMessage('foo');

    const { errors } = sender;
    expect(errors).to.be.lengthOf(channels.length);
    channels.forEach((channel) => {
      expect(errors.has(channel)).to.be.equal(true);
      expect(errors.get(channel)).to.be.instanceof(Error);
    });
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

  it('sets 1000 ms as default message delay for setTimeout function', async () => {
    const newSender = new BulkMessageSender(channels, slackClientMock);
    expect(newSender.postMessageDelay).to.be.equal(1000);
  });
});
