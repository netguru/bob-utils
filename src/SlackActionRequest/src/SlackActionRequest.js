const axios = require('axios');

class SlackActionRequest {
  constructor(url, isEphemeral) {
    this.url = url;
    this.isEphemeral = isEphemeral;
  }

  async request(body) {
    if (!this.isEphemeral) {
      Object.assign(body, { response_type: 'in_channel' });
    }

    return axios.post(this.url, body);
  }
}

module.exports = SlackActionRequest;
