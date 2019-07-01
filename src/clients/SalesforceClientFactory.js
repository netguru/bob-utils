/* eslint-disable camelcase */
const Rollbar = require('rollbar');
const autoBind = require('auto-bind');
const { Connection } = require('jsforce');

const redisClient = require('./RedisClientFactory');

const {
  redisTokenKey,
  oauth: { path },
  authorizationAttempts,
} = require('../../config/salesforce.config.json');

const {
  SALESFORCE_INSTANCE_URL,
  SALESFORCE_LOGIN_URL,
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  SALESFORCE_REDIRECT_URL,
  SALESFORCE_USERNAME,
  SALESFORCE_PASSWORD,
  SALESFORCE_SECRET_TOKEN,
} = process.env;

class SalesforceClient {
  constructor() {
    this.connection = new Connection({
      instanceUrl: SALESFORCE_INSTANCE_URL,
      oauth2: {
        loginUrl: SALESFORCE_LOGIN_URL,
        clientId: SALESFORCE_CLIENT_ID,
        clientSecret: SALESFORCE_CLIENT_SECRET,
        redirectUri: `${SALESFORCE_REDIRECT_URL}/${path}`,
      },
    });

    this.robot = null;
    this.redis = redisClient();

    autoBind(this);
  }

  async authorize() {
    const username = SALESFORCE_USERNAME;
    const password = `${SALESFORCE_PASSWORD}${SALESFORCE_SECRET_TOKEN}`;

    await this.tryAuthenticate(username, password, authorizationAttempts);
  }

  async tryAuthenticate(username, password, attempts) {
    if (attempts <= 0) {
      const error = Error('Salesforce authentication failed');
      Rollbar.error(error);
      throw error;
    }

    try {
      const credentials = await this.connection.oauth2.authenticate(username, password);
      this.setCredentials(credentials);
    } catch (error) {
      await this.tryAuthenticate(username, password, attempts - 1);
    }
  }

  hasCredentials() {
    return this.connection.instanceUrl && this.connection.accessToken;
  }

  async restoreCredentials() {
    try {
      const credentials = this.redis.get(redisTokenKey);
      if (!credentials) {
        throw new Error('No credentials stored in Redis');
      }

      await this.setCredentials(credentials);
    } catch (error) {
      await this.authorize();
    }
  }

  async setCredentials(credentials) {
    const { instance_url, access_token } = credentials;
    this.connection.instanceUrl = instance_url;
    this.connection.accessToken = access_token;

    return this.redis.set(redisTokenKey, JSON.stringify(credentials));
  }
}

const salesforceClientSingleton = new SalesforceClient();

module.exports = () => salesforceClientSingleton;
module.exports.salesforceClient = salesforceClientSingleton;
