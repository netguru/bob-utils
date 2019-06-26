const autoBind = require('auto-bind');
const asyncro = require('asyncro');
const Rollbar = require('rollbar');

const { postMessageDelay } = require('../../../config/slack.config.json');

const { createTextMessage } = require('./messages');

const { HUBOT_SLACK_TOKEN } = process.env;

class BulkMessageSender {
  constructor(channels, logger, slackClient) {
    this.channels = channels;
    this.logger = logger;
    this.slackClient = slackClient;

    autoBind(this);
  }

  static create(channels, logger, slackClient) {
    return new BulkMessageSender(channels, logger, slackClient);
  }

  async bulkSendMessage(messageContents) {
    const message = createTextMessage(messageContents);
    const statistics = {
      sent: [],
      notSent: [],
    };
    await asyncro.reduce(
      this.channels,
      async (ret, channel) => this.sendBulkTask(ret, message, channel),
      statistics,
    );
    return statistics;
  }

  async sendBulkTask(ret, message, channel) {
    const { sent, notSent } = ret;
    const wasSent = await this.postDelayedMessageToChannel(message, channel);
    const list = wasSent ? sent : notSent;
    list.push(channel);
    return ret;
  }

  async postDelayedMessageToChannel(message, channel) {
    try {
      await this.postMessageToChannel(message, channel);
      await BulkMessageSender.delayAction();
      return true;
    } catch (error) {
      Rollbar.error(error);
      this.logger.error(`Cannot send message to "${channel}", ${error.toString()}`);
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
    return new Promise(resolve => setTimeout(resolve, postMessageDelay));
  }
}

module.exports = BulkMessageSender;
