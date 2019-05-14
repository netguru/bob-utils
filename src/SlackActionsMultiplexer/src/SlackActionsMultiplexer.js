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

    this.multiplexer = new RespondMultiplexer(logger);
    this.slashActionsMultiplexer = new RespondMultiplexer(logger);

    this.setDefaultResponse();
    this.createRoutesForActions(logger);
    this.createRoutesForSlash(logger);
  }

  addAction(regexp, action) {
    if (this.actionIdAlreadyExists(regexp)) {
      throw new Error('Callback id duplication');
    }
    this.multiplexer.addResponse(regexp, action);
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

  createRoutesForActions(logger) {
    this.robot.router.post(actionsEndpoint, async (req, res) => {
      const actionJSONPayload = this.unescapeQueryParamsInActionPayload(req.body.payload);

      try {
        await this.sendResponseMessage(actionJSONPayload);

        this.multiplexer.choose(actionJSONPayload.callback_id);
        await this.multiplexer.chosen.action(res, actionJSONPayload, this.robot);
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
      const { text, command } = req.body;

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

  setDefaultResponse() {
    this.multiplexer.setDefaultResponse(() => { throw Error('No callback found'); });
    this.slashActionsMultiplexer.setDefaultResponse(() => { throw Error('No slash command found'); });
  }

  actionIdAlreadyExists(regexp) {
    return _.some(this.multiplexer.responses,
      ({ trigger }) => trigger.toString() === regexp.toString());
  }

  slashCommandIdAlreadyExists(regexp) {
    return _.some(this.slashActionsMultiplexer.responses,
      ({ trigger }) => trigger.toString() === regexp.toString());
  }

  unescapeQueryParamsInActionPayload(payload) {
    let payloadJSON = JSON.parse(payload);
    const queryParams = _.get(payloadJSON, 'actions[0].selected_options[0].value');
    if(typeof queryParams === 'string' || queryParams instanceof String) {
      payloadJSON.actions[0].selected_options[0].value = decode(queryParams);
    }
    return payloadJSON;
  }
}

module.exports = SlackActionsMultiplexer;
