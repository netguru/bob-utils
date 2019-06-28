const Rollbar = require('rollbar');
const { Connection } = require('jsforce');
const autoBind = require('auto-bind');

const redisClient = require('./RedisClientFactory');

const {
  oauth: { path },
} = require('../../config/salesforce.config.json');

const {
  SALESFORCE_LOGIN_URL,
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  SALESFORCE_REDIRECT_URI,
  SALESFORCE_USERNAME,
  SALESFORCE_PASSWORD,
} = process.env;

class SalesforceClient {
  constructor() {
    this.oAuthClient = new Connection({
      oauth2: {
        loginUrl: SALESFORCE_LOGIN_URL,
        clientId: SALESFORCE_CLIENT_ID,
        clientSecret: SALESFORCE_CLIENT_SECRET,
        redirectUri: `${SALESFORCE_REDIRECT_URI}/${path}`,
      },
    });

    this.accessToken = null;
    this.refreshToken = null;
    this.instanceUrl = null;

    this.redis = redisClient();

    autoBind(this);
  }

  async authorize() {
    const username = SALESFORCE_USERNAME;
    const password = SALESFORCE_PASSWORD;

    try {
      return await this.oAuthClient.login(username, password);
    } catch (error) {
      Rollbar.error(error);

      throw new Error('Authentication failed');
    }
  }

  isAuthorized() {
    return Object.keys(this.oAuthClient).includes('userInfo');
  }

  async getProjects() {
    if (!this.isAuthorized()) {
      await this.authorize();
    }

    return this.oAuthClient.query('SELECT name FROM project__c');
  }
}

module.exports = () => new SalesforceClient();
