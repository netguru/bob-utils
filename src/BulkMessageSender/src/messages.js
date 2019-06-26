const MessageBuilder = require('../../MessageBuilder');

const createTextMessage = (text) => {
  const builder = new MessageBuilder({ text });
  return builder.buildMessage();
};

module.exports = {
  createTextMessage,
};
