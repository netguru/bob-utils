const AtlassianClientFactory = require('./src/clients/AtlassianClientFactory');
const CircleciClientFactory = require('./src/clients/CircleciClientFactory');
const GithubClientFactory = require('./src/clients/GithubClientFactory');
const GoogleCalendarClientFactory = require('./src/clients/GoogleCalendarClientFactory');
const RedisClientFactory = require('./src/clients/RedisClientFactory');
const SlackClientFactory = require('./src/clients/SlackClientFactory');

module.exports = {
  AtlassianClientFactory,
  CircleciClientFactory,
  GithubClientFactory,
  GoogleCalendarClientFactory,
  RedisClientFactory,
  SlackClientFactory,
};
