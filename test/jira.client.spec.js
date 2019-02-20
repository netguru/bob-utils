const { expect } = require('chai');
const sinon = require('sinon');

const JiraClient = require('../src/clients/JiraClient');

describe('Unit tests - Jira Client', () => {
  let jiraClient;
  let client;

  beforeEach(() => {
    client = {
      baseUrl: 'hubot_atlassian_url',
      auth: {
        username: 'atlassian_username',
        password: 'atlassian_auth_token',
      },
    };

    jiraClient = new JiraClient(client);
  });

  afterEach(() => sinon.restore());

  describe('request', () => {
    it('should make a request to jira api and return data', async () => {
      const axios = sinon.stub(jiraClient, 'axios').resolves({ data: 'data' });

      const result = await jiraClient.request('/api', { query: { param: 1 } }, 'get');

      expect(result).to.equal('data');
      expect(axios.callCount).to.equal(1);
      expect(axios.firstCall.calledWithExactly({
        url: '/api', auth: client.auth, method: 'get', query: { param: 1 },
      }));
    });

    it('should make a request to jira api and throw on error', async () => {
      sinon.stub(jiraClient, 'axios').rejects('err');
      sinon.stub(jiraClient, 'isAuthenticated').returns(true);
      sinon.stub(jiraClient, 'notStatusError').returns(true);

      await expect(jiraClient.request('/api', { query: { param: 1 } }, 'get'))
        .to.be.rejectedWith('Request error');
    });

    it('should throw not authenticated error', async () => {
      sinon.stub(jiraClient, 'axios').rejects('err');
      sinon.stub(jiraClient, 'isAuthenticated').returns(false);

      await expect(jiraClient.request('/api', { query: { param: 1 } }, 'get'))
        .to.be.rejectedWith('Is not authenticated');
    });

    it('should throw wrong status error', async () => {
      sinon.stub(jiraClient, 'axios').rejects('err');
      sinon.stub(jiraClient, 'isAuthenticated').returns(true);
      sinon.stub(jiraClient, 'notStatusError').returns(false);

      await expect(jiraClient.request('/api', { query: { param: 1 } }, 'get'))
        .to.be.rejectedWith('Wrong status');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false if response and status equals 401', () => {
      const response = {
        status: 401,
      };

      const result = jiraClient.isAuthenticated(response);

      expect(result).to.equal(false);
    });
  });

  describe('notStatusError', () => {
    it('should return true if there is no data in response', () => {
      const response = {};

      const result = jiraClient.notStatusError(response);

      expect(result).to.equal(true);
    });

    it('should return false if there is at least one error message that contains word status', () => {
      const response = {
        data: {
          errorMessages: [
            'some error message',
            'another message',
            "'status' message",
          ],
        },
      };

      const result = jiraClient.notStatusError(response);

      expect(result).to.equal(false);
    });
  });
});
