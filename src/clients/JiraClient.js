/* eslint-disable class-methods-use-this */

const axios = require('axios');
const rollbar = require('rollbar');

const assertOrThrow = require('../AssertOrThrow');

class JiraClient {
  constructor(client) {
    this.authorization = client.auth;
    this.baseUrl = client.baseUrl;
    this.axios = axios.create({
      baseURL: this.baseUrl,
    });
  }

  async request(url, params, method = 'get') {
    const auth = this.authorization;

    try {
      const { data } = await this.axios({
        url, auth, method, ...params,
      });

      return data;
    } catch (err) {
      rollbar.error(err);
      assertOrThrow(this.isAuthenticated(err.response), new Error('Is not authenticated'));
      assertOrThrow(this.notStatusError(err.response), new Error('Wrong status'));

      throw Error('Request error');
    }
  }

  isAuthenticated(response) {
    return response && response.status !== 401;
  }

  notStatusError(response) {
    if (!response.data) {
      return true;
    }

    const { errorMessages } = response.data;

    return errorMessages && !errorMessages.some(message => message.includes('\'status\''));
  }
}

module.exports = JiraClient;
