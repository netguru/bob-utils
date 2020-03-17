const { expect } = require('chai');
const ModalBuilder = require('../src/ModalBuilder');

describe('ModalBuilder', () => {
  it('should create valid view payload', () => {
    const params = {
      callback_id: 'callback_id',
      submit: 'submit',
      close: 'close',
      title: 'title',
      private_metadata: 'private_metadata',
      clear_on_close: 'clear_on_close',
      notify_on_close: 'notify_on_close',
      external_id: 'external_id',
    };

    const modal = new ModalBuilder(params)
      .addBlock({})
      .addBlocks([{}, {}])
      .buildModal();

    expect(modal).to.be.deep.equal({
      type: 'modal',
      submit: {
        type: 'plain_text',
        text: 'submit',
        emoji: true,
      },
      close: {
        type: 'plain_text',
        text: 'close',
        emoji: true,
      },
      title: {
        type: 'plain_text',
        text: 'title',
        emoji: true,
      },
      private_metadata: 'private_metadata',
      blocks: [{}, {}, {}],
      callback_id: 'callback_id',
      clear_on_close: 'clear_on_close',
      notify_on_close: 'notify_on_close',
      external_id: 'external_id',
    });
  });
});
