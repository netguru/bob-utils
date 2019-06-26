const autoBind = require('auto-bind');
const asyncro = require('asyncro');

const { createTextMessage } = require('./messages');

const { HUBOT_SLACK_TOKEN } = process.env;

class BulkMessageSender {
  constructor(channels, slackClient, options = {}) {
    this.channels = channels;
    this.slackClient = slackClient;

    this.postMessageDelay = options.delay || 1000;
    this.errors = new Map();

    autoBind(this);
  }

  static create(channels, slackClient, options = {}) {
    return new BulkMessageSender(channels, slackClient, options);
  }

  async bulkSendMessage(messageContents) {
    const message = createTextMessage(messageContents);
    const statistics = {
      sent: [],
      notSent: [],
    };
    await asyncro.reduce(
      this.channels,
      async (ret, channel) => this.sendBulkTaskReducer(ret, message, channel),
      statistics,
    );
    return statistics;
  }

  async sendBulkTaskReducer(ret, message, channel) {
    const { sent, notSent } = ret;
    const wasSent = await this.postDelayedMessageToChannel(message, channel);
    const appendedArray = wasSent ? sent : notSent;
    appendedArray.push(channel);

    return ret;
  }

  async postDelayedMessageToChannel(message, channel) {
    try {
      await this.postMessageToChannel(message, channel);
      await BulkMessageSender.delayAction();
      return true;
    } catch (error) {
      this.errors.set(channel, error);
      return false;
    }
  }

  async postMessageToChannel(message, channel) {
    return this.slackClient.chat.postMessage({
      token: HUBOT_SLACK_TOKEN,
      ...message,
      channel,
    });
  }

  static async delayAction() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }
}

module.exports = BulkMessageSender;
