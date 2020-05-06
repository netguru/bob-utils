const _ = require('lodash');

class MessageBuilder {
  constructor(params = {}) {
    this.attachments = [];
    this.blocks = [];
    this.options = params;
  }

  /**
   * Adds attachment based on params to builder.
   * @param {Object} params - object containing necessary params.
   */

  addAttachment(params = {}) {
    this.attachments.push(params);
    return this;
  }

  /**
   * Adds a single block to message builder.
   * @param {Object} block object representing block.
   */

  addBlock(block = {}) {
    this.blocks.push(block);
    return this;
  }

  /**
   * Adds blocks from array to message builder.
   * @param  {Array} blocks array containing block objects.
   */

  addBlocks(blocks = []) {
    this.blocks.push(...blocks);
    return this;
  }

  /**
   * Adds field to message builder.
   * @param {Object} field object representing field.
   */

  addField(field = {}) {
    this.options = _.merge(this.options, field);
    return this;
  }

  /**
   * Disables preview of a links in message.
   */

  disableLinksPreview() {
    this.options = _.merge(this.options, {
      unfurl_links: false,
      unfurl_media: false,
    });

    return this;
  }

  /**
   * Builds message based on params and blocks in message builder.
   * @param {Object} params object representing params.
   */

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
