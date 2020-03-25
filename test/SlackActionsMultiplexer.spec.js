const Helper = require('hubot-test-helper');
const { expect } = require('chai');
const request = require('supertest');
const path = require('path');
const sinon = require('sinon');

const SlackActionsMultiplexer = require('../src/SlackActionsMultiplexer');
const dependenciesLocator = require('../src/DependenciesLocator');

const { actionsEndpoint, slashEndpoint } = require('../config/slackActions.config.json');

const helper = new Helper(path.resolve(__dirname, './factories/ScriptFactory.js'));

describe('SlackActionsMultiplexer test suite', () => {
  let room;
  let slackActions;

  beforeEach(() => {
    room = helper.createRoom();
    slackActions = new SlackActionsMultiplexer(room.robot);
    dependenciesLocator.forceSet('slackActionsMultiplexer', slackActions);
  });

  afterEach(() => {
    room.destroy();
    sinon.restore();
  });

  it('responds with status 500 and throws error when callback is not specified', async () => {
    const payload = JSON.stringify({ type: 'interactive_message', callback_id: '' });

    const response = await request(room.robot.server)
      .post(actionsEndpoint)
      .send({ payload });

    expect(response.statusCode).to.equal(500);
  });

  it('Should throw an error in case of callback duplicate', () => {
    slackActions.addAction(/some_cb/, () => {});

    expect(() => slackActions.addAction(/some_cb/, () => { })).to.throw('Callback id duplication');
  });

  it('Should throw an error in case of slashcommand duplicate', () => {
    slackActions.addSlashCommand(/some_cb/, () => {});

    expect(() => slackActions.addSlashCommand(/some_cb/, () => { })).to.throw('Slash command duplication');
  });

  it('Should throw an error in case of slashcommand duplicate', () => {
    slackActions.addExternalData(/some_cb/, () => {});

    expect(() => slackActions.addExternalData(/some_cb/, () => { })).to.throw('External data id duplication');
  });

  it('Should throw an error in case of block action duplicate', () => {
    slackActions.addBlock(/some_cb/, () => {});

    expect(() => slackActions.addBlock(/some_cb/, () => { })).to.throw('Block id duplication');
  });

  it('Should throw an error in case of event duplicate', () => {
    slackActions.addEvent(/some_cb/, () => {});

    expect(() => slackActions.addEvent(/some_cb/, () => { })).to.throw('Event duplication');
  });

  it('addReactionEvent should call addEvent method', () => {
    const addEventStub = sinon.stub(slackActions, 'addEvent');
    const regexFake = /test/;
    const actionFake = () => {};
    slackActions.addReactionEvent(regexFake, actionFake);
    expect(addEventStub.calledOnce).to.be.equal(true);
  });

  it('Should unescape HTML entities in query params', async () => {
    let queryParams = null;
    const responseStub = sinon
      .stub(slackActions, 'sendResponseMessage')
      .callsFake((payload) => {
        queryParams = payload.actions[0].selected_options[0].value;
      });

    slackActions.addAction(/callback/, (req) => { req.status(200).end(); });

    const payload = JSON.stringify({
      type: 'interactive_message',
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

    await request(room.robot.server)
      .post(actionsEndpoint)
      .send({ payload });

    expect(responseStub.calledOnce).to.equal(true);
    expect(queryParams).to.equal('{"title":"\'<foo> & bar""}');
  });

  it('chooses block_actions multiplexer for block actions message', async () => {
    const muxData = slackActions.getInteractiveMultiplexer({ type: 'block_actions' });

    expect(muxData).to.be.an('Object').that.has.keys('multiplexer', 'path');
    expect(muxData.multiplexer).to.be.equal(slackActions.blockActionMultiplexer);
    expect(muxData.path).to.be.equal('actions[0].action_id');
  });

  it('chooses interactive_message multiplexer as the default one', async () => {
    const muxData = slackActions.getInteractiveMultiplexer({ type: 'foo' });

    expect(muxData).to.be.an('Object').that.has.keys('multiplexer', 'path');
    expect(muxData.multiplexer).to.be.equal(slackActions.actionMultiplexer);
    expect(muxData.path).to.be.equal('callback_id');
  });

  it('responds with status 500 and throws error when callback is not specified', async () => {
    const payload = JSON.stringify({ type: 'interactive_message', text: 'example' });

    const response = await request(room.robot.server)
      .post(slashEndpoint)
      .send({ payload });

    expect(response.statusCode).to.equal(500);
  });

  it('responds with status 500 and throws error when action_id is not specified', async () => {
    const payload = JSON.stringify({ type: 'block_actions', actions: [{ action_id: '' }] });

    const response = await request(room.robot.server)
      .post(actionsEndpoint)
      .send({ payload });

    expect(response.statusCode).to.equal(500);
  });

  it('should call action multiplexer handler when callback_id is specified', async () => {
    const payload = JSON.stringify({ type: 'interactive_message', callback_id: 'some_cb' });
    const interactiveActionChooseSpy = sinon.spy(slackActions.actionMultiplexer, 'choose');
    slackActions.addAction(/some_cb/, (res) => { res.send(); });

    const response = await request(room.robot.server)
      .post(actionsEndpoint)
      .send({ payload });

    expect(response.statusCode).to.equal(200);
    expect(interactiveActionChooseSpy.called).to.equal(true);
  });

  it('should call block multiplexer handler when action_id is specified', async () => {
    const payload = JSON.stringify({ type: 'block_actions', actions: [{ action_id: 'some_cb' }] });
    const bloackActionChooseSpy = sinon.spy(slackActions.blockActionMultiplexer, 'choose');
    slackActions.addBlock(/some_cb/, (res) => { res.send(); });

    const response = await request(room.robot.server)
      .post(actionsEndpoint)
      .send({ payload });

    expect(response.statusCode).to.equal(200);
    expect(bloackActionChooseSpy.called).to.equal(true);
  });
});
