/* eslint-disable class-methods-use-this */
const { google } = require('googleapis');
const autoBind = require('auto-bind');
const Rollbar = require('rollbar');

const redisClient = require('./RedisClientFactory');
const MessageBuilder = require('../MessageBuilder');
const assertOrThrow = require('../AssertOrThrow');
const { scopes, path } = require('../../config/google.config.json').oauth;

const {
  CALENDAR_CLIENT_ID,
  CALENDAR_CLIENT_SECRET,
  GOOGLE_AUTH_CALLBACK_URL,
} = process.env;

class GoogleClient {
  constructor() {
    this.oAuthClient = new google.auth.OAuth2({
      clientId: CALENDAR_CLIENT_ID,
      clientSecret: CALENDAR_CLIENT_SECRET,
      redirectUri: `${GOOGLE_AUTH_CALLBACK_URL}/${path}`,
    });

    this.redis = redisClient();
    this.robot = null;
    this.token = {};
    this.requestPerformed = false;

    this.initRefreshTokenEvent();

    autoBind(this);
  }

  async retrieveTokenFromDB() {
    const redisToken = await this.redis.get('gToken');
    assertOrThrow(redisToken, new Error('Token is not available'));

    this.token = JSON.parse(redisToken);

    return this.token;
  }

  getProperty(object, propertyPath) {
    const property = propertyPath[0];

    if (propertyPath.length === 1) {
      return object[property];
    }

    return this.getProperty(object[property], propertyPath.slice(1));
  }

  async getFunctionFor(name, version, ...propertyPath) {
    this.verifyGoogleProperty(name);

    try {
      if (!this.token) {
        await this.retrieveTokenFromDB();
      }

      this.setCredentials(this.token);

      return async (...args) => {
        try {
          const client = google[name]({ version, auth: this.oAuthClient });
          const response = await this.getProperty(client, propertyPath).call(client, ...args);

          return response;
        } catch (error) {
          Rollbar.error(error);
          this.robot.logger.error(error);

          if ([400, 401, 403].includes(error.response.status)) {
            this.askForAuthorization();
          }

          this.robot.logger.error({
            error: JSON.stringify(error.response.data),
            method: JSON.stringify(propertyPath),
            arguments: JSON.stringify(args),
          });

          throw new Error(`Error on google ${name}, ${version}, ${propertyPath}`);
        }
      };
    } catch (error) {
      this.askForAuthorization();
      throw new Error('Could not get google client, authentication required');
    }
  }

  verifyGoogleProperty(name) {
    if (!google[name]) {
      this.robot.logger.error(`Googleapis does not have ${name} property`);
      throw new Error(`Googleapis does not have ${name} property`);
    }
  }

  setRobot(robot) {
    this.robot = robot;
  }

  hasRobot() {
    return this.robot;
  }

  throwRefreshTokenError() {
    this.messageMasterRoom(this.refreshTokenMessage());

    throw new Error('Could not retrieve the refresh token');
  }

  refreshTokenMessage() {
    return new MessageBuilder()
      .addField({
        text: 'Refresh token is not availavle, make sure it is the first authentication for this app with the used account. \n If it is not first authentication:',
      })
      .addAttachment({ text: 'go to https://myaccount.google.com/permissions' })
      .addAttachment({ text: 'remove permisions for the is free app' })
      .addAttachment({ text: 'then authenticate again' })
      .buildMessage();
  }

  setCredentials(token) {
    if (!token || !token.refresh_token) {
      this.throwRefreshTokenError();
    }

    this.redis.set('gToken', JSON.stringify(token));

    return this.oAuthClient.setCredentials(token);
  }

  getAuthUrl() {
    return this.oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  askForAuthorization() {
    this.messageMasterRoom(`Could you authorize me with google?\n${this.getAuthUrl()}`);
  }

  logAuthorizationUrl() {
    this.robot.logger.info('google auth url: ', this.getAuthUrl());
  }

  async initTokenRoute() {
    this.robot.router.get(`/${path}`, async (req, res) => {
      const { code } = req.query;

      if (code) {
        try {
          this.requestPerformed = true;
          this.oAuthClient.getToken(code);
        } catch (error) {
          return res.status(400).send('Could not authorize');
        }

        return res.status(200).send('You can close this window now, thanks!');
      }

      this.messageMasterRoom('Property code is required! Authorization failed.');

      return res.status(422).send('Property code is required');
    });

    try {
      const token = await this.retrieveTokenFromDB();

      this.setCredentials(token);
      this.logAuthorizationUrl();
    } catch (error) {
      this.askForAuthorization();
    }
  }

  checkRefreshToken(token) {
    if (this.requestPerformed && !token.refresh_token) {
      this.requestPerformed = false;
      this.throwRefreshTokenError();
    }
  }

  sendSuccess() {
    if (this.requestPerformed) {
      this.messageMasterRoom('Authorization succeeded');
      this.requestPerformed = false;
    }
  }

  initRefreshTokenEvent() {
    this.oAuthClient.on('tokens', (token) => {
      try {
        this.checkRefreshToken(token);

        Object.assign(this.token, token);

        this.setCredentials(this.token);
      } catch (error) {
        return this.robot.logger.error(error);
      }

      return this.sendSuccess();
    });
  }

  messageMasterRoom(message) {
    this.robot.messageRoom(process.env.CALENDAR_OAUTH_ROOM_ID, message);
  }
}

const googleClient = new GoogleClient();

module.exports = async (robot) => {
  if (!googleClient.hasRobot()) {
    googleClient.setRobot(robot);
    await googleClient.initTokenRoute();
  }

  return googleClient.getFunctionFor;
};

module.exports.googleClient = googleClient;
