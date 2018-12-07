module.exports = (AltassianAPI) => {
  const auth = {
    username: process.env.HUBOT_ATLASSIAN_USERNAME,
    password: process.env.HUBOT_ATLASSIAN_AUTH_TOKEN,
  };

  const baseUrl = process.env.HUBOT_ATLASSIAN_URL;
  return new AltassianAPI({ auth, baseUrl });
};
