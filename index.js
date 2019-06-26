const AtlassianClientFactory = require('./src/clients/AtlassianClientFactory');
const CircleciClientFactory = require('./src/clients/CircleciClientFactory');
const GithubClientFactory = require('./src/clients/GithubClientFactory');
const GoogleClientFactory = require('./src/clients/GoogleClientFactory');
const RedisClientFactory = require('./src/clients/RedisClientFactory');
const SlackClientFactory = require('./src/clients/SlackClientFactory');
const JiraClient = require('./src/clients/JiraClient');

const MessageRenderer = require('./src/MessageRenderer');
const MessageBuilder = require('./src/MessageBuilder');
const RespondMultiplexer = require('./src/RespondMultiplexer');
const ObjectToArray = require('./src/ObjectToArray');
const BotResponseError = require('./src/BotResponseError');
const assertOrSendAndThrow = require('./src/AssertOrSendAndThrow');
const assertOrThrow = require('./src/AssertOrThrow');
const asyncAssertOrThrow = require('./src/AsyncAssertOrThrow');
const dependenciesLocator = require('./src/DependenciesLocator');
const SlackActionsMultiplexer = require('./src/SlackActionsMultiplexer');
const botCron = require('./src/BotCron');
const DialogBuilder = require('./src/DialogBuilder');
const SlackActionRequest = require('./src/SlackActionRequest');
const PluginsLoader = require('./src/PluginsLoader');
const Locales = require('./src/Locales');
const SlackIdMapper = require('./src/SlackIdMapper');
const CustomRoutes = require('./src/CustomRoutes');
const BulkMessageSender = require('./src/BulkMessageSender');

module.exports = {
  botCron,
  MessageRenderer,
  MessageBuilder,
  RespondMultiplexer,
  ObjectToArray,
  BotResponseError,
  assertOrSendAndThrow,
  assertOrThrow,
  asyncAssertOrThrow,
  dependenciesLocator,
  SlackActionsMultiplexer,
  DialogBuilder,
  SlackActionRequest,
  PluginsLoader,
  Locales,
  SlackIdMapper,
  CustomRoutes,
  BulkMessageSender,
  clients: {
    AtlassianClientFactory,
    CircleciClientFactory,
    GithubClientFactory,
    GoogleClientFactory,
    RedisClientFactory,
    SlackClientFactory,
    JiraClient,
  },
};
