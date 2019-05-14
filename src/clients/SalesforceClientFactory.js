/* eslint-disable class-methods-use-this */
var jsforce = require('jsforce');

const {
  SALESFORCE_LOGIN_URL,
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  SALESFORCE_REDIRECT_URI,
  SALESFORCE_USERNAME,
  SALESFORCE_PASSWORD,
} = process.env;

class SalesforceClient {
  constructor() {
    this.conn = new jsforce.Connection({
      oauth2 : {
        loginUrl: SALESFORCE_LOGIN_URL,
        clientId: SALESFORCE_CLIENT_ID,
        clientSecret: SALESFORCE_CLIENT_SECRET,
        redirectUri: SALESFORCE_REDIRECT_URI,
        }
    });

    const username = SALESFORCE_USERNAME;
    const password = SALESFORCE_PASSWORD;

    this.conn.login(username, password);
  }

  query() {
    return this.conn.query('');
  }
}

module.exports = SalesforceClient;