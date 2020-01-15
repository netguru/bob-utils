/* eslint-disable camelcase */
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

  createApexCall(method, endpoint) {
    const query = this.executeApex.bind(this, method, endpoint);

    return async (...params) => {
      try {
        const result = await query(...params);
        return result;
      } catch (error) {
        await this.authorize();
        return query(...params);
      }
    };
  }

  async executeApex(method, endpoint, ...params) {
    return this.connection.apex[method](endpoint, ...params);
  }

  createQueryCall(soqlQuery) {
    const query = this.executeQuery.bind(this, soqlQuery);

    return async () => {
      try {
        const result = await query();
        return result;
      } catch (error) {
        await this.authorize();
        return query();
      }
    }
  }

  async executeQuery(query) {
    return this.connection.query(query);
  }

  async initialize() {
    try {
      const token = await this.restoreCredentials();
      await this.setCredentials(token);
    } catch (error) {
      await this.authorize();
    }
  }

  async authorize() {
    const username = SALESFORCE_USERNAME;
    const password = `${SALESFORCE_PASSWORD}${SALESFORCE_SECRET_TOKEN}`;

    return this.tryAuthenticate(username, password, authorizationAttempts);
  }

  async tryAuthenticate(username, password, attempts) {
    if (attempts <= 0) {
      throw new Error('Salesforce authentication failed');
    }

    try {
      const credentials = await this.connection.oauth2.authenticate(username, password);
      return this.setCredentials(credentials);
    } catch (error) {
      return this.tryAuthenticate(username, password, attempts - 1);
    }
  }

  async restoreCredentials() {
    const rawCredentials = await this.redis.get(redisTokenKey);
    return JSON.parse(rawCredentials);
  }

  async setCredentials(credentials) {
    const { instance_url, access_token } = credentials;
    this.connection.instanceUrl = instance_url;
    this.connection.accessToken = access_token;

    return this.redis.set(redisTokenKey, JSON.stringify(credentials));
  }

  setRobot(robot) {
    this.robot = robot;
  }

  hasRobot() {
    return this.robot;
  }
}

const salesforceClientSingleton = new SalesforceClient();

module.exports = async (robot) => {
  if (!salesforceClientSingleton.hasRobot()) {
    salesforceClientSingleton.setRobot(robot);
    await salesforceClientSingleton.initialize();
  }

  return salesforceClientSingleton;
};
module.exports.salesforceClient = salesforceClientSingleton;
