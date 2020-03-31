class BotResponseError extends Error {
  constructor(errorMessage, userMessage, data) {
    super(errorMessage);
    this.userMessage = userMessage;
    this.data = data;
  }
}

module.exports = BotResponseError;
