const _ = require('lodash');

class MessageBuilder {
  constructor(params = {}) {
    this.attachments = [];
    this.options = params;
  }

  addAttachment(params = {}) {
    this.attachments.push(params);
    return this;
  }

  addField(field = {}) {
    this.options = _.merge(this.options, field);
    return this;
  }

  disableLinksPreview() {
    this.options = _.merge(this.options, {
      unfurl_links: false,
      unfurl_media: false,
    });

    return this;
  }

  buildMessage(params = {}) {
    return {
      ...(this.attachments.length && { attachments: this.attachments }), ...this.options, ...params,
    };
  }
}

module.exports = MessageBuilder;
