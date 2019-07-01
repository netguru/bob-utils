/* eslint-disable prefer-destructuring */
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');

chai.use(chaiAsPromised);
const { expect } = chai;

const env = {
  SALESFORCE_INSTANCE_URL: 'https://localhost',
  SALESFORCE_LOGIN_URL: 'https://force.com',
  SALESFORCE_CLIENT_ID: '1337',
  SALESFORCE_CLIENT_SECRET: 'sha-2',
  SALESFORCE_REDIRECT_URL: 'https://localhost',
  SALESFORCE_USERNAME: 'username',
  SALESFORCE_PASSWORD: 'pwd',
  SALESFORCE_SECRET_TOKEN: 'realy-secret',
};

const redis = {
  set: () => {},
};

sinon.stub(process, 'env').value({ ...process.env, ...env });
const SalesforceClient = proxyquire('../src/clients/SalesforceClientFactory', {
  './RedisClientFactory': () => redis,
});

describe('Salesforce factory client test suite', () => {
  let salesforceClient;

  before(() => {
    salesforceClient = SalesforceClient.salesforceClient;
  });

  afterEach(() => sinon.restore());

  it('Athorizes with given credentials', async () => {
    const authenticateStub = sinon.stub(salesforceClient, 'tryAuthenticate');
    const salesforcePassword = env.SALESFORCE_PASSWORD + env.SALESFORCE_SECRET_TOKEN;

    await salesforceClient.authorize();

    const [username, password] = authenticateStub.lastCall.args;

    expect(username).to.be.equal(env.SALESFORCE_USERNAME);
    expect(password).to.be.equal(salesforcePassword);
  });

  it('Tries to authenticate at least 5 times on failure', async () => {
    const authenticateStub = sinon
      .stub(salesforceClient.connection.oauth2, 'authenticate')
      .rejects();

    try {
      await salesforceClient.authorize();
      // eslint-disable-next-line no-empty
    } catch (error) {}

    expect(authenticateStub.callCount).to.be.equal(5);
  });

  it('Sets connection credentials and stores them to Redis.', async () => {
    sinon.stub(salesforceClient.connection.oauth2, 'authenticate').resolves({
      instance_url: 'instanceUrl',
      access_token: 'accessToken',
    });

    const redisSetStub = sinon.stub(salesforceClient.redis, 'set');

    await salesforceClient.authorize();

    expect(salesforceClient.connection.instanceUrl).to.be.equal('instanceUrl');
    expect(salesforceClient.connection.accessToken).to.be.equal('accessToken');
    expect(redisSetStub.called).to.be.equal(true);
  });
});
