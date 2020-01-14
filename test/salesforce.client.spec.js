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
  get: () => {},
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

  it('Authorizes with given credentials', async () => {
    const authenticateStub = sinon.stub(salesforceClient, 'tryAuthenticate');
    const salesforcePassword = env.SALESFORCE_PASSWORD + env.SALESFORCE_SECRET_TOKEN;

    await salesforceClient.authorize();

    const [username, password] = authenticateStub.lastCall.args;

    expect(username).to.be.equal(env.SALESFORCE_USERNAME);
    expect(password).to.be.equal(salesforcePassword);
  });

  it('Tries to authenticate at least 5 times on failure', async () => {
    sinon.stub(salesforceClient, 'robot').value({ logger: { error: () => {} } });
    const clientAuthenticateStub = sinon
      .stub(salesforceClient.connection.oauth2, 'authenticate')
      .rejects();

    const tryAuthenticateSpy = sinon.spy(salesforceClient, 'tryAuthenticate');

    try {
      await salesforceClient.authorize();
      // eslint-disable-next-line no-empty
    } catch (error) {}

    expect(clientAuthenticateStub.callCount).to.be.equal(5);
    expect(tryAuthenticateSpy.callCount).to.be.equal(6);
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

  it('Restores credentials on initialization', async () => {
    sinon.stub(salesforceClient.redis, 'get').resolves(
      JSON.stringify({
        instance_url: 'instanceUrl',
        access_token: 'accessToken',
      }),
    );

    await SalesforceClient();

    expect(salesforceClient.connection.instanceUrl).to.be.equal('instanceUrl');
    expect(salesforceClient.connection.accessToken).to.be.equal('accessToken');
  });

  it('Omits initialization if module already loaded', async () => {
    sinon.stub(salesforceClient, 'hasRobot').returns(true);
    const initializeSpy = sinon.spy(salesforceClient, 'initialize');

    await SalesforceClient();

    expect(initializeSpy.called).to.be.equal(false);
  });

  it('Tries to authorise if cannot get credentials from Redis', async () => {
    sinon.stub(salesforceClient.redis, 'get').returns();

    const authorizeStub = sinon.stub(salesforceClient, 'authorize').resolves();

    await SalesforceClient();

    expect(authorizeStub.called).to.be.equal(true);
  });

  it('Creates apex call that binds method and endpoint values', async () => {
    const executeApexStub = sinon.stub(salesforceClient, 'executeApex').resolves();

    const apexGetMethod = salesforceClient.createApexCall('get', '/projects');
    expect(apexGetMethod).to.be.a('function');

    const options = { foo: 'bar' };

    await apexGetMethod(options);
    expect(executeApexStub.called).to.be.equal(true);
    expect(executeApexStub.calledWith('get', '/projects', options)).to.be.equal(true);
  });

  it('Runs authorization if unable to process apex call', async () => {
    const authorizeStub = sinon.stub(salesforceClient, 'authorize');
    const executeApexStub = sinon.stub(salesforceClient, 'executeApex');

    executeApexStub.onFirstCall().rejects();
    executeApexStub.onSecondCall().resolves();

    const apexGetMethod = salesforceClient.createApexCall('get', '/projects');
    await apexGetMethod();

    expect(authorizeStub.called).to.be.equal(true);
    expect(executeApexStub.calledTwice).to.be.equal(true);
  });

  it('Calls Connection.apex[HTTPmethod] function when creating apex call', async () => {
    const apexFake = { get: sinon.stub() };
    sinon.stub(salesforceClient.connection, 'apex').value(apexFake);

    const params = ['/endpoint', 'val1', 'val2', {}];

    await salesforceClient.executeApex('get', ...params);

    expect(apexFake.get.calledWith(...params)).to.be.equal(true);
  });

  it('Creates query call that binds query SOQL string', async () => {
    const executeQueryStub = sinon.stub(salesforceClient, 'executeQuery').resolves();

    const queryGetMethod = salesforceClient.createQueryCall('SELECT Id From Project__c');
    expect(queryGetMethod).to.be.a('function');

    await queryGetMethod();
    expect(executeQueryStub.called).to.be.equal(true);
    expect(executeQueryStub.calledWith('SELECT Id From Project__c')).to.be.equal(true);
  });

  it('Runs authorization if unable to process query call', async () => {
    const authorizeStub = sinon.stub(salesforceClient, 'authorize');
    const executeQueryStub = sinon.stub(salesforceClient, 'executeQuery');

    executeQueryStub.onFirstCall().rejects();
    executeQueryStub.onSecondCall().resolves();

    const queryGetMethod = salesforceClient.createQueryCall('SELECT Id From Project__c');
    await queryGetMethod();

    expect(authorizeStub.called).to.be.equal(true);
    expect(executeQueryStub.calledTwice).to.be.equal(true);
  });

  it('Calls Connection.query function when creating query call', async () => {
    const queryStub = sinon.stub(salesforceClient.connection, 'query').resolves();
    const params = ['SELECT Id From Project__c'];
    await salesforceClient.executeQuery(...params);
    expect(queryStub.calledWith(...params)).to.be.equal(true)
  });
});
