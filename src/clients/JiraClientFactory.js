const JiraClient = require('jira-connector');

module.exports = () => new JiraClient({
  host: process.env.HUBOT_ATLASSIAN_URL,
  basic_auth: {
    username: process.env.HUBOT_ATLASSIAN_USERNAME,
    password: process.env.HUBOT_ATLASSIAN_AUTH_TOKEN,
  },
});
