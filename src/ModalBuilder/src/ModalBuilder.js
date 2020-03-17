/* eslint-disable */
const BlockBuilder = require('../../BlockBuilder');

class ModalBuilder {
  constructor({
    callback_id,
    submit,
    close,
    title,
    private_metadata,
    blocks,
    clear_on_close,
    notify_on_close,
    external_id,
  }) {
    this.submit = submit && BlockBuilder.createPlainTextObject(submit);
    this.close = close && BlockBuilder.createPlainTextObject(close);
    this.title = title && BlockBuilder.createPlainTextObject(title);
    this.privateMetadata = BlockBuilder.serializeValue(private_metadata);
    this.blocks = blocks || [];
    this.callbackId = callback_id;
    this.clearOnClose = clear_on_close;
    this.notifyOnClose = notify_on_close;
    this.externalId = external_id;
  }

  addBlock(block) {
    this.blocks.push(block);
    return this;
  }

  addBlocks(blocks) {
    this.blocks = [...this.blocks, ...blocks];
    return this;
  }

  buildModal() {
    return {
      type: 'modal',
      ...(this.submit && { submit: this.submit }),
      ...(this.close && { close: this.close }),
      ...(this.title && { title: this.title }),
      ...(this.clearOnClose && { clear_on_close: this.clearOnClose }),
      ...(this.callbackId && { callback_id: this.callbackId }),
      ...(this.privateMetadata && { private_metadata: this.privateMetadata }),
      ...(this.clearOnClose && { clear_on_close: this.clearOnClose }),
      ...(this.notifyOnClose && { notify_on_close: this.notifyOnClose }),
      ...(this.externalId && { external_id: this.externalId }),
      blocks: this.blocks,
    };
  }
}

module.exports = ModalBuilder;
