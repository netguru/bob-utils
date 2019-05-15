const Helper = require('hubot-test-helper');
const { expect } = require('chai');
const request = require('supertest');
const path = require('path');

const SlackActionsMultiplexer = require('../src/SlackActionsMultiplexer');
const dependenciesLocator = require('../src/DependenciesLocator');

const { actionsEndpoint, slashEndpoint } = require('../config/slackActions.config.json');

const helper = new Helper(path.resolve(__dirname, './factories/ScriptFactory.js'));

describe('SlackActionsMultiplexer test suite', () => {
  let room;
  let slackActions;

  before(() => {
    room = helper.createRoom();
    dependenciesLocator.forceSet('slackActionsMultiplexer', new SlackActionsMultiplexer(room.robot));
    slackActions = dependenciesLocator.get('slackActionsMultiplexer');
  });

  after(() => {
    room.destroy();
  });

  it('responds with status 500 and throws error when callback is not specified', async () => {
    const payload = JSON.stringify({ callback_id: '' });

    const response = await request(room.robot.server)
      .post(actionsEndpoint)
      .send({ payload });

    expect(response.statusCode).to.equal(500);
  });

  it('Should throw an error in case of callback duplicate', () => {
    slackActions.addAction(/some_cb/, () => {});

    expect(() => slackActions.addAction(/some_cb/, () => { })).to.throw('Callback id duplication');
  });

  it('Should unescape HTML entities in query params', () => {
    const payload = JSON.stringify({
      callback_id: 'callback',
      actions: [
        {
          selected_options: [
            {
              value: '{"title":"\'&lt;foo&gt; &amp; bar""}',
            },
          ],
        },
      ],
    });
    const unescapedPayload = slackActions.unescapeQueryParamsInActionPayload(payload);
    const queryParams = unescapedPayload.actions[0].selected_options[0].value;

    expect(queryParams).to.equal('{"title":"\'<foo> & bar""}');
  });

  it('responds with status 500 and throws error when callback is not specified', async () => {
    const payload = JSON.stringify({ text: 'example' });

    const response = await request(room.robot.server)
      .post(slashEndpoint)
      .send({ payload });

    expect(response.statusCode).to.equal(500);
  });

  it('Should throw an error in case of callback duplicate', () => {
    slackActions.addSlashCommand(/some_cb/, () => {});

    expect(() => slackActions.addSlashCommand(/some_cb/, () => { })).to.throw('Slash command duplication');
  });
});
