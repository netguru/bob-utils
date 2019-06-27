const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { expect } = chai;

const slackClientMock = { chat: { postMessage: () => {} } };

const BulkMessageSender = require('../src/BulkMessageSender');

describe('BulkMessageSender test suite', () => {
  let channels;
  let message;
  let sender;

  before(() => {
    channels = ['channel-1', 'channel-2', 'channel-3', 'channel-4'];
    message = { text: 'foo' };
  });

  beforeEach(() => {
    sinon.stub(BulkMessageSender, 'delayAction').resolves();
    sender = new BulkMessageSender(slackClientMock, { message, channels });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('throws an error when trying to send empty message', async () => {
    const emptyMessageSender = new BulkMessageSender(slackClientMock);
    const emptyBulkMessageSend = async () => emptyMessageSender.bulkSendMessage();

    expect(emptyBulkMessageSend()).to.eventually.throw(/Cannot bulk-send empty message/);
  });

  it('throws an error when trying to send empty channels list', async () => {
    const emptyChannelsSender = new BulkMessageSender(slackClientMock, {
      message: { text: 'foo' },
    });
    const emptyBulkMessageSend = async () => emptyChannelsSender.bulkSendMessage();

    expect(emptyBulkMessageSend()).to.eventually.throw(/Channels list is empty in bulk-send/);
  });

  it('calls exports static method that sends bulk messages', async () => {
    const bulkSendStub = sinon.stub(BulkMessageSender.prototype, 'bulkSendMessage').resolves();

    await BulkMessageSender.send();

    expect(bulkSendStub.called).to.be.equal(true);
  });

  it('sends message to appropiate channels', async () => {
    const postMessageSpy = sinon.spy(slackClientMock.chat, 'postMessage');

    await sender.bulkSendMessage();

    expect(postMessageSpy.callCount).to.be.equal(channels.length);
  });

  it('gathers all occuring errors within given channels', async () => {
    sinon.stub(slackClientMock.chat, 'postMessage').rejects();

    await sender.bulkSendMessage();

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

    const statistics = await sender.bulkSendMessage();

    console.log(statistics.errors);

    expect(postMessageStub.callCount).to.be.equal(channels.length);
    expect(statistics.sent).has.lengthOf(2);
    expect(statistics.notSent).has.lengthOf(2);
    expect(statistics.errors).has.lengthOf(2);
  });

  it('waits appropiate amount of time between message sends', async () => {
    BulkMessageSender.delayAction.restore();
    const timeoutStub = sinon.stub(global, 'setTimeout').callsFake(fn => fn());

    await sender.bulkSendMessage();

    expect(timeoutStub.callCount).to.be.equal(channels.length);
  });

  it('sets 1000 ms as default message delay for setTimeout function', async () => {
    const newSender = new BulkMessageSender(channels, slackClientMock);
    expect(newSender.postMessageDelay).to.be.equal(1000);
  });
});
