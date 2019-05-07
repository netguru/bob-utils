const Helper = require('hubot-test-helper');
const sinon = require('sinon');
const request = require('supertest');
const { google } = require('googleapis');
const fsPath = require('path');

const chai = require('chai');
chai.use(require('chai-as-promised'));

const { expect } = chai;
const { scopes, path } = require('../config/google.config.json').oauth;

const UserFactory = require('./factories/UserFactory');

const googleClientExtractor = require('../src/clients/GoogleClientFactory');
const MessageBuilder = require('../src/MessageBuilder');

const redisClient = {
  get: () => Promise.resolve(),
  set: () => Promise.resolve(),
};

const helper = new Helper(fsPath.resolve(__dirname, './factories/ScriptFactory.js'));

describe('Google extractor client test suite', () => {
  let room = null;
  let googleClient;

  beforeEach(async () => {
    const roomName = 'room';
    room = helper.createRoom({ name: roomName });
    sinon.stub(process, 'env').value({ CALENDAR_OAUTH_ROOM_ID: roomName });

    const user = UserFactory({ name: 'John', id: 1, email_address: 'John@gmail.com' });
    user.profile.fields = null;
    room.robot.brain.userForId(1, user);

    ({ googleClient } = googleClientExtractor);
    sinon.stub(googleClient, 'redis').value(redisClient);
  });

  afterEach(() => {
    sinon.restore();
    room.destroy();
  });

  it('Should send the auth url if token is not available on init', async () => {
    sinon.stub(redisClient, 'get').rejects();
    sinon.stub(googleClient.oAuthClient, 'getToken').callsFake(() => { });
    sinon.stub(googleClient, 'robot').value(null);

    await googleClientExtractor(room.robot);

    const authUrl = googleClient.oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });

    const expected = [
      ['hubot', `Could you authorize me with google?\n${authUrl}`],
    ];

    expect(room.messages).to.eql(expected);
  });

  it('Should return status 200 if code is available', async () => {
    sinon.stub(googleClient.oAuthClient, 'getToken').callsFake(() => { });
    sinon.stub(googleClient, 'robot').value(null);

    await googleClientExtractor(room.robot);

    await request(room.robot.server)
      .get(`/${path}`)
      .query({ code: 1 })
      .expect(200);
  });

  it('Should return status 400 if code is available but wrong', async () => {
    sinon.stub(googleClient.oAuthClient, 'getToken').throws();
    sinon.stub(googleClient, 'robot').value(null);

    await googleClientExtractor(room.robot);

    await request(room.robot.server)
      .get(`/${path}`)
      .query({ code: 1 })
      .expect(400);
  });

  it('Should return status 422 if code is not available', async () => {
    sinon.stub(googleClient.oAuthClient, 'getToken').callsFake(() => { });
    sinon.stub(googleClient, 'robot').value(null);

    await googleClientExtractor(room.robot);

    await request(room.robot.server)
      .get(`/${path}`)
      .expect(422);
  });

  it('Should check that the room does not have the auth url when gToken is available', async () => {
    sinon.stub(redisClient, 'get').resolves(JSON.stringify({ refresh_token: true }));

    await googleClientExtractor(room.robot);

    const expected = [];

    expect(room.messages).to.eql(expected);
  });

  it('Should send an information about missing refresh token, wrong one is in the db', async () => {
    sinon.stub(googleClient, 'robot').value(room.robot);

    const wrongToken = { no_refresh_token: true };
    expect(() => googleClient.setCredentials(wrongToken)).to.throw();

    const expectedMessage = new MessageBuilder()
      .addField({
        text: 'Refresh token is not availavle, make sure it is the first authentication for this app with the used account. \n If it is not first authentication:',
      })
      .addAttachment({ text: 'go to https://myaccount.google.com/permissions' })
      .addAttachment({ text: 'remove permisions for the is free app' })
      .addAttachment({ text: 'then authenticate again' })
      .buildMessage();

    const expected = [
      ['hubot', expectedMessage],
    ];

    expect(room.messages).to.eql(expected);
  });

  it('Should  send an information about missing refresh token, on first authentication', async () => {
    sinon.stub(googleClient, 'robot').value(room.robot);

    sinon.stub(googleClient, 'token').value({});
    sinon.stub(googleClient, 'requestPerformed').value(true);

    const token = { no_refresh_token: 'emit' };
    googleClient.oAuthClient.emit('tokens', token);

    const expectedMessage = new MessageBuilder()
      .addField({
        text: 'Refresh token is not availavle, make sure it is the first authentication for this app with the used account. \n If it is not first authentication:',
      })
      .addAttachment({ text: 'go to https://myaccount.google.com/permissions' })
      .addAttachment({ text: 'remove permisions for the is free app' })
      .addAttachment({ text: 'then authenticate again' })
      .buildMessage();

    const expected = [
      ['hubot', expectedMessage],
    ];

    expect(room.messages).to.eql(expected);
  });

  it('Save emtted token and inform about success', async () => {
    sinon.stub(googleClient, 'robot').value(room.robot);

    sinon.stub(googleClient, 'token').value({});
    sinon.stub(googleClient, 'requestPerformed').value(true);

    const token = { refresh_token: 'emit' };
    googleClient.oAuthClient.emit('tokens', token);

    const expected = googleClient.token;

    const expectedMessage = [
      ['hubot', 'Authorization succeeded'],
    ];

    expect(expected).to.eql(token);
    expect(room.messages).to.eql(expectedMessage);
  });

  it('Save emtted token and not inform about success', async () => {
    sinon.stub(googleClient, 'robot').value(room.robot);

    sinon.stub(googleClient, 'token').value({});
    sinon.stub(googleClient, 'requestPerformed').value(false);

    const token = { refresh_token: 'emit' };
    googleClient.oAuthClient.emit('tokens', token);

    const expected = googleClient.token;

    expect(expected).to.eql(token);
    expect(room.messages).to.eql([]);
  });

  it('Log error on wrong emtted token', async () => {
    const spy = sinon.spy();

    sinon.stub(googleClient, 'robot').value({
      logger: {
        error: spy,
      },
    });

    sinon.stub(googleClient, 'setCredentials').throws();

    const token = { refresh_token: 'emit' };
    googleClient.oAuthClient.emit('tokens', token);

    expect(spy.calledOnce).to.eql(true);
  });

  it('Should throw an error if google does not have given property', async () => {
    const name = 'somefakeproperty';

    await expect(googleClient.getFunctionFor(name)).to.eventually.rejectedWith(`Googleapis does not have ${name} property`);
  });

  it('Should return a client', async () => {
    const name = 'calendar';
    const version = 'v3';
    const propsPath = ['events', 'list'];

    const functionSpy = sinon.spy();

    sinon.stub(googleClient, 'token').value({ refresh_token: 'ok' });
    sinon.stub(google, 'calendar').returns({
      events: {
        list: functionSpy,
      },
    });

    const googleFunction = await googleClient.getFunctionFor(name, version, ...propsPath);

    await googleFunction();

    expect(functionSpy.calledOnce).to.eql(true);
  });

  it('Should ask for token if none is available when looking for function', async () => {
    const name = 'calendar';
    const version = 'v3';

    sinon.stub(googleClient, 'token').value(undefined);
    sinon.stub(redisClient, 'get').resolves(undefined);
    sinon.stub(googleClient, 'robot').value(room.robot);

    await expect(googleClient.getFunctionFor(name, version)).to
      .eventually
      .rejectedWith('Could not get google client, authentication required');

    const authUrl = googleClient.oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });

    const expected = [
      ['hubot', `Could you authorize me with google?\n${authUrl}`],
    ];

    expect(room.messages).to.eql(expected);
  });

  it('Should ask for token if the error status 400, 401 or 403 was thrown', async () => {
    const name = 'calendar';
    const version = 'v3';
    const propsPath = ['events', 'list'];

    sinon.stub(googleClient, 'token').value({});
    sinon.stub(googleClient, 'robot').value(room.robot);

    const statusError = new Error('bad');
    statusError.response = { status: 401 };

    sinon.stub(googleClient, 'token').value({ refresh_token: 'ok' });
    sinon.stub(google, 'calendar').returns({
      events: {
        list: () => Promise.reject(statusError),
      },
    });

    const googleFunction = await googleClient.getFunctionFor(name, version, ...propsPath);

    await expect(googleFunction()).to
      .eventually
      .rejectedWith(`Error on google ${name}, ${version}, ${propsPath}`);

    const authUrl = googleClient.oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });

    const expected = [
      ['hubot', `Could you authorize me with google?\n${authUrl}`],
    ];

    expect(room.messages).to.eql(expected);
  });
});
