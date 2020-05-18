const JiraClient = require('jira-client');

module.exports = (options = {}) =>
  new JiraClient({
    host: process.env.HUBOT_ATLASSIAN_HOST,
    username: process.env.HUBOT_ATLASSIAN_USERNAME,
    password: process.env.HUBOT_ATLASSIAN_AUTH_TOKEN,
    apiVersion: '3',
    strictSSL: true,
    ...options,
  });
