const sinon = require('sinon');
const { expect } = require('chai');

const SalesforceClient = require('../src/clients/SalesforceClientFactory');

describe('Salesforce factory client test suite', () => {
  let salesforceClient;

  beforeEach(async () => {
    salesforceClient = SalesforceClient();
  });

  afterEach(() => sinon.restore());

  it('Should authorize user when credentials are correct', async () => {
    sinon.stub(salesforceClient.oAuthClient, 'login').callsFake(() => {
      salesforceClient.oAuthClient = { userInfo: {} };
    });

    await salesforceClient.authorize();

    expect(salesforceClient.isAuthorized()).to.equal(true);
  });

  it('Should throw an error when credentials are incorrect', async () => {
    sinon.stub(salesforceClient.oAuthClient, 'login').throws();
    const error = 'Authentication failed';

    await expect(salesforceClient.authorize()).to.eventually.rejectedWith(error);
  });

  it('Should return project list from salesforce and authorized before it', async () => {
    const loginStub = sinon.stub(salesforceClient.oAuthClient, 'login').callsFake(() => {
      salesforceClient.oAuthClient.userInfo = {};
    });

    sinon.stub(salesforceClient.oAuthClient, 'query').resolves({
      totalSize: 2,
      done: true,
      records: [{ Name: 'project 1' }, { Name: 'project 2' }],
    });

    const { records } = await salesforceClient.getProjects();

    expect(records.length).to.equal(2);
    expect(loginStub.calledOnce).to.equal(true);
  });
});
