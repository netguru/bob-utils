const Circleci = require('circleci');

module.exports = () => new Circleci({ auth: process.env.HUBOT_CIRCLECI_TOKEN });
