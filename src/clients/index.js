const AtlassianClientFactory = require('./src/AtlassianClientFactory');
const CircleciClientFactory = require('./src/CircleciClientFactory');
const GithubClientFactory = require('./src/GithubClientFactory');
const GoogleCalendarClientFactory = require('./src/GoogleCalendarClientFactory');
const RedisClientFactory = require('./src/RedisClientFactory');
const SlackClientFactory = require('./src/SlackClientFactory');

module.exports = {
  AtlassianClientFactory,
  CircleciClientFactory,
  GithubClientFactory,
  GoogleCalendarClientFactory,
  RedisClientFactory,
  SlackClientFactory,
};
