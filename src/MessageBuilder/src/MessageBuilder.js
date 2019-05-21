const _ = require('lodash');

class MessageBuilder {
  constructor(params = {}) {
    this.attachments = [];
    this.blocks = [];
    this.options = params;
  }

  addAttachment(params = {}) {
    this.attachments.push(params);
    return this;
  }

  addBlock(block = {}) {
    this.blocks.push(block);
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
      ...(this.attachments.length && { attachments: this.attachments }),
      ...(this.blocks.length && { blocks: this.blocks }),
      ...this.options,
      ...params,
    };
  }
}

module.exports = MessageBuilder;
