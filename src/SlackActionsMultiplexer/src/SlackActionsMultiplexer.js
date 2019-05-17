/* eslint-disable class-methods-use-this */
const Rollbar = require('rollbar');
const _ = require('lodash');
const decode = require('unescape');

const RespondMultiplexer = require('../../RespondMultiplexer');
const SlackActionRequest = require('../../SlackActionRequest');
const { actionsEndpoint, slashEndpoint } = require('../../../config/slackActions.config.json');

class SlackActionsMultiplexer {
  constructor(robot) {
    this.robot = robot;

    const { logger } = robot;

    this.actionMultiplexer = new RespondMultiplexer(logger);
    this.blockActionMultiplexer = new RespondMultiplexer(logger);
    this.slashActionsMultiplexer = new RespondMultiplexer(logger);

    this.assignActionMultiplexers();
    this.setDefaultResponse();

    this.createRoutesForInteractive(logger);
    this.createRoutesForSlash(logger);
  }

  addAction(regexp, action) {
    if (this.actionIdAlreadyExists(regexp)) {
      throw new Error('Callback id duplication');
    }
    this.actionMultiplexer.addResponse(regexp, action);
  }

  addBlock(regexp, action) {
    if (this.blockIdAlreadyExists(regexp)) {
      throw new Error('Block id duplication');
    }
    this.blockActionMultiplexer.addResponse(regexp, action);
  }

  addSlashCommand(regexp, action) {
    if (this.slashCommandIdAlreadyExists(regexp)) {
      throw new Error('Slash command duplication');
    }
    this.slashActionsMultiplexer.addResponse(regexp, action);
  }

  async sendResponseMessage(payload) {
    let state;

    if (payload && payload.state) {
      state = JSON.parse(payload.state);
    }

    if (state && state.response) {
      const { url, isEphemeral = true } = state.response;

      await new SlackActionRequest(url, isEphemeral).request({
        text: 'Your request is beeing proccesed',
      });
    }
  }

  unescapeQueryParamsInActionPayload(payload) {
    const payloadJSON = JSON.parse(payload);
    const queryPath = 'actions[0].selected_options[0].value';
    const queryParams = _.result(payloadJSON, queryPath);
    if (_.isString(queryParams)) {
      _.set(payloadJSON, queryPath, decode(queryParams));
    }
    return payloadJSON;
  }

  createRoutesForInteractive(logger) {
    this.robot.router.post(actionsEndpoint, async (req, res) => {
      const actionJSONPayload = this.unescapeQueryParamsInActionPayload(req.body.payload);

      try {
        await this.sendResponseMessage(actionJSONPayload);
        const { multiplexer, path } = this.selectInteractiveMultiplexer(actionJSONPayload);

        multiplexer.choose(_.get(actionJSONPayload, path));
        await multiplexer.chosen.action(res, actionJSONPayload, this.robot);
      } catch (error) {
        Rollbar.error(error);
        logger.error(error);

        if (error.data) {
          logger.info({
            error: JSON.stringify(error.data),
            actionJSONPayload,
          });
        }

        res.sendStatus(500);
      }
    });
  }

  createRoutesForSlash(logger) {
    this.robot.router.post(slashEndpoint, async (req, res) => {
      const { command } = req.body;

      try {
        this.slashActionsMultiplexer.choose(command);
        await this.slashActionsMultiplexer.chosen.action(res, req.body, this.robot);
      } catch (error) {
        Rollbar.error(error);
        logger.error(error);
        res.sendStatus(500);
      }
    });
  }

  assignActionMultiplexers() {
    const assignMultiplexer = (multiplexer, path) => ({ multiplexer, path });
    this.interactiveMultiplexers = new Map([
      ['interactive_message', assignMultiplexer(this.actionMultiplexer, 'callback_id')],
      ['block_actions', assignMultiplexer(this.blockActionMultiplexer, 'actions[0].action_id')],
    ]);
  }

  selectInteractiveMultiplexer({ type } = {}) {
    const muxData = this.interactiveMultiplexers.get(type);
    if (!muxData) {
      throw Error('Unknown interactive message type');
    }
    return muxData;
  }

  setDefaultResponse() {
    this.actionMultiplexer.setDefaultResponse(() => { throw Error('No callback found'); });
    this.blockActionMultiplexer.setDefaultResponse(() => { throw Error('No block action found'); });
    this.slashActionsMultiplexer.setDefaultResponse(() => { throw Error('No slash command found'); });
  }

  checkIdCollision(regexp, multiplexer) {
    return _.some(multiplexer.responses,
      ({ trigger }) => trigger.toString() === regexp.toString());
  }

  actionIdAlreadyExists(regexp) {
    return this.checkIdCollision(regexp, this.actionMultiplexer);
  }

  blockIdAlreadyExists(regexp) {
    return this.checkIdCollision(regexp, this.blockActionMultiplexer);
  }

  slashCommandIdAlreadyExists(regexp) {
    return this.checkIdCollision(regexp, this.slashActionsMultiplexer);
  }
}

module.exports = SlackActionsMultiplexer;
