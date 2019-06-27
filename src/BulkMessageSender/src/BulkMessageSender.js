const autoBind = require('auto-bind');
const asyncro = require('asyncro');
const _ = require('lodash');

const { HUBOT_SLACK_TOKEN } = process.env;

class BulkMessageSender {
  constructor(slackClient, options = {}) {
    this.slackClient = slackClient;

    this.message = options.message;
    this.channels = options.channels || [];
    this.postMessageDelay = options.delay || 1000;

    this.errors = new Map();

    autoBind(this);
  }

  static async send(slackClient, options = {}) {
    const sender = new BulkMessageSender(slackClient, options);
    return sender.bulkSendMessage();
  }

  async bulkSendMessage() {
    this.verify();

    return asyncro.reduce(this.channels, this.sendBulkTaskReducer, {
      sent: [],
      notSent: [],
    });
  }

  verify() {
    if (_.isEmpty(this.message)) {
      throw new Error('Cannot bulk-send empty message');
    }
    if (_.isEmpty(this.channels)) {
      throw new Error('Channels list is empty in bulk-send');
    }
  }

  async sendBulkTaskReducer(ret, channel) {
    const { sent, notSent } = ret;
    const wasSent = await this.postDelayedMessageToChannel(channel);
    const appendedArray = wasSent ? sent : notSent;
    appendedArray.push(channel);

    return ret;
  }

  async postDelayedMessageToChannel(channel) {
    try {
      await this.postMessageToChannel(this.message, channel);
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
