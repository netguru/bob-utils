class DialogBuilder {
  constructor(client, payload) {
    const { triggerId, state, ...dialogOptions } = payload;

    this.client = client;
    this.dialog = {
      token: process.env.HUBOT_OAUTH_SLACK_TOKEN,
      trigger_id: triggerId,
      dialog: {
        state: (state && JSON.stringify(state)),
        ...dialogOptions,
      },
    };
  }

  async open(dialog) {
    return this.client.dialog.open(dialog || this.dialog);
  }
}

module.exports = DialogBuilder;
