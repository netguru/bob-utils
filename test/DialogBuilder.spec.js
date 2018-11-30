const { expect } = require('chai');
const DialogBuilder = require('../src/DialogBuilder');

const client = {
  dialog: {
    open: () => Promise.resolve({ ok: true }),
  },
};

describe('DialogBuilder test suite', () => {
  it('Should create build and dialog', async () => {
    const trigger = 'trig';
    const title = 'title';
    const callbackId = 'calb';

    const dialog = new DialogBuilder(client, {
      triggerId: trigger,
      submit_label: 'Create',
      callback_id: callbackId,
      title,
      elements: [
        {
          label: 'label',
          type: 'text',
          name: 'name',
          optional: false,
          placeholder: 'value',
        },
      ],
      state: { field: 'value' },
    });

    expect(dialog.dialog).to.eql({
      token: process.env.HUBOT_OAUTH_SLACK_TOKEN,
      trigger_id: trigger,
      dialog: {
        state: JSON.stringify({ field: 'value' }),
        submit_label: 'Create',
        callback_id: callbackId,
        title,
        elements: [
          {
            label: 'label',
            type: 'text',
            name: 'name',
            optional: false,
            placeholder: 'value',
          },
        ],
      },
    });

    const response = await dialog.open();

    expect(response.ok).to.eql(true);
  });
});
