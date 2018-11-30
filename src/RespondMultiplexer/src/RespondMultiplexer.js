const Rollbar = require('rollbar');

class RespondMultiplexer {
  constructor(logger) {
    this.default = {
      action: () => {},
      trigger: /(.*)/,
    };
    this.chosen = {};
    this.responses = [];
    this.logger = logger;
    this.defaultUserErrorMessage = 'Something went wrong :(';
  }

  addResponse(trigger, action) {
    this.responses.push({ trigger, action });
  }

  setDefaultResponse(action) {
    this.default = {
      action,
      trigger: /(.*)/,
    };
  }

  setDefaultUserErrorMessage(text) {
    this.defaultUserErrorMessage = text;
  }

  logError(err) {
    Rollbar.error(err);
    this.logger.error(err);
  }

  choose(text) {
    const response = this.responses.find(c => c.trigger.exec(text)) || this.default;
    const match = response.trigger.exec(text);

    this.chosen = { action: response.action, match };

    return this;
  }

  async exec(res) {
    const { action, match } = this.chosen;
    let result;

    try {
      result = await action(res, match);
    } catch (err) {
      this.logError(err);

      const response = err.userMessage || this.defaultUserErrorMessage;
      res.send(response);
    }
    return result;
  }
}

module.exports = RespondMultiplexer;
