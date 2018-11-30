const { expect } = require('chai');
const sinon = require('sinon');

const axios = require('axios');

const SlackActionRequest = require('../src/SlackActionRequest');

describe('Slack Action Request test suite', () => {
  afterEach(() => sinon.restore());

  it('Should assign the in_channel if not ephemeral', async () => {
    const spy = sinon.spy(Object, 'assign');
    sinon.stub(axios, 'post').resolves();

    await new SlackActionRequest('url', false).request({});

    expect(spy.calledOnce).to.equal(true);
  });

  it('Should NOT assign the in_channel if not ephemeral', async () => {
    const spy = sinon.spy(Object, 'assign');
    sinon.stub(axios, 'post').resolves();

    await new SlackActionRequest('url', true).request({});

    expect(spy.notCalled).to.equal(true);
  });
});
