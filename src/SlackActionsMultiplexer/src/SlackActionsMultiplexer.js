/* eslint-disable class-methods-use-this */
const Rollbar = require('rollbar');
const _ = require('lodash');
const decode = require('unescape');

const RespondMultiplexer = require('../../RespondMultiplexer');
const SlackActionRequest = require('../../SlackActionRequest');
const {
  actionsEndpoint,
  slashEndpoint,
  eventsEndpoint,
  externalSelectEndpoint,
} = require('../../../config/slackActions.config.json');

class SlackActionsMultiplexer {
  constructor(robot) {
    this.robot = robot;

    const { logger } = robot;

    this.actionMultiplexer = new RespondMultiplexer(logger);
    this.blockActionMultiplexer = new RespondMultiplexer(logger);
    this.slashActionsMultiplexer = new RespondMultiplexer(logger);
    this.eventMultiplexer = new RespondMultiplexer(logger);
    this.externalDataMultiplexer = new RespondMultiplexer(logger);

    this.setupActionMultiplexers();
    this.setDefaultResponse();

    this.createRoutesForInteractive(logger);
    this.createRoutesForSlash(logger);
    this.createRoutesForEvents(logger);
    this.createRoutesForExternalData(logger);
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

  addEvent(regexp, action) {
    if (this.eventAlreadyExists(regexp)) {
      throw new Error('Event duplication');
    }
    this.eventMultiplexer.addResponse(regexp, action);
  }

  addReactionEvent(regexp, action) {
    this.addEvent(regexp, action);
  }

  addEventHandshaker(regexp, action) {
    if (this.eventAlreadyExists(regexp)) {
      throw new Error('Event duplication');
    }
    this.eventMultiplexer.addResponse(regexp, action);
  }

  addExternalData(regexp, action) {
    if (this.externalDataIdAlreadyExists(regexp)) {
      throw new Error('External data id duplication');
    }
    this.externalDataMultiplexer.addResponse(regexp, action);
  }

  async sendResponseMessage(payload) {
    let state;

    if (payload && payload.state) {
      state = (typeof payload.state === 'string' && JSON.parse(payload.state)) || payload.state;
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
        const { multiplexer, path } = this.getInteractiveMultiplexer(actionJSONPayload);

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

  createRoutesForExternalData(logger) {
    this.robot.router.post(externalSelectEndpoint, async (req, res) => {
      const payload = JSON.parse(req.body.payload);
      try {
        let id;
        if (payload.container.type === 'view') {
          const {
            action_id: actionId,
            view: { external_id: externalId },
          } = payload;
          id = `${externalId}:${actionId}`;
        }

        this.externalDataMultiplexer.choose(id);
        await this.externalDataMultiplexer.chosen.action(res, payload, this.robot);
      } catch (error) {
        Rollbar.error(error);
        logger.error(error);
        res.sendStatus(500);
      }
    });
  }

  createRoutesForEvents(logger) {
    this.robot.router.post(eventsEndpoint, async (req, res) => {
      try {
        if (req.body.event) {
          const { type, reaction, channel } = req.body.event;
          if (reaction) {
            this.eventMultiplexer.choose(`${type}:${reaction}`);
          }
          if (channel) {
            this.eventMultiplexer.choose(`${type}:${channel.name}`);
          }
        }
        if (req.body.type === 'url_verification') {
          return res.send(req.body.challenge);
        }
        await this.eventMultiplexer.chosen.action(res, req, this.robot);
      } catch (error) {
        if (error.message === 'Default event triggered') {
          res.sendStatus(200);
        } else {
          Rollbar.error(error);
          logger.error(error);
          res.sendStatus(500);
        }
      }
    });
  }

  setupActionMultiplexers() {
    const assignMultiplexer = (multiplexer, path) => ({ multiplexer, path });
    this.interactiveMultiplexers = new Map([
      ['interactive_message', assignMultiplexer(this.actionMultiplexer, 'callback_id')],
      ['block_actions', assignMultiplexer(this.blockActionMultiplexer, 'actions[0].action_id')],
      ['view_submission', assignMultiplexer(this.actionMultiplexer, 'view.callback_id')],
    ]);
  }

  getInteractiveMultiplexer({ type } = {}) {
    const muxData = this.interactiveMultiplexers.get(type);
    return muxData || this.interactiveMultiplexers.get('interactive_message');
  }

  setDefaultResponse() {
    this.actionMultiplexer.setDefaultResponse(() => {
      throw Error('No callback found');
    });
    this.blockActionMultiplexer.setDefaultResponse(() => {
      throw Error('No block action found');
    });
    this.slashActionsMultiplexer.setDefaultResponse(() => {
      throw Error('No slash command found');
    });
    this.externalDataMultiplexer.setDefaultResponse(() => {
      throw Error('No external data action found');
    });
    this.eventMultiplexer.setDefaultResponse(() => {
      throw Error('Default event triggered');
    });
  }

  checkIdCollision(regexp, multiplexer) {
    return _.some(multiplexer.responses, ({ trigger }) => trigger.toString() === regexp.toString());
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

  externalDataIdAlreadyExists(regexp) {
    return this.checkIdCollision(regexp, this.externalDataMultiplexer);
  }

  eventAlreadyExists(regexp) {
    return this.checkIdCollision(regexp, this.eventMultiplexer);
  }
}

module.exports = SlackActionsMultiplexer;
