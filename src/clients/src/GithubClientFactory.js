const GithubClient = require('@octokit/rest');

module.exports = () => {
  const githubClient = GithubClient();
  githubClient.authenticate({
    type: 'token',
    token: process.env.HUBOT_GITHUB_AUTH_TOKEN,
  });
  return githubClient;
};
