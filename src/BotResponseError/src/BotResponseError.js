
class BotResponseError extends Error {
  constructor(errorMessage, userMessage) {
    super(errorMessage);
    this.userMessage = userMessage;
  }
}

module.exports = BotResponseError;
