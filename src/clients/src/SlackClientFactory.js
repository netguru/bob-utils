const SlackClient = require('@slack/client');

module.exports = () => new SlackClient.WebClient(process.env.HUBOT_OAUTH_SLACK_TOKEN);
