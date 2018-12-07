const ConfluenceAPI = require('../../src/confluence/src/confluence.api');
const JiraAPI = require('../../src/jira/src/jira.api');

module.exports = () => {
  const auth = {
    username: process.env.HUBOT_ATLASSIAN_USERNAME,
    password: process.env.HUBOT_ATLASSIAN_AUTH_TOKEN,
  };

  const baseUrl = process.env.HUBOT_ATLASSIAN_URL;
  const confluenceAPI = new ConfluenceAPI({ auth, baseUrl });
  const jiraAPI = new JiraAPI({ auth, baseUrl });
  return { confluenceAPI, jiraAPI };
};
