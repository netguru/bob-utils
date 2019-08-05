const axios = require("axios");
const Rollbar = require("rollbar");

class AnalyticsReporter {
  constructor(trackingId, analyticsUrl) {
    this.trackingId = trackingId;
    this.analyticsUrl = analyticsUrl;
  }

  reportEvent = (category, action, label) => {
    const url = `${analyticsUrl}?v=1&t=event&tid=${analyticsId}&uid=1&ea=${action}&el=${label}&ec=${category}`;

    try {
      return axios.post(url);
    } catch (error) {
      Rollbar.error(error);

      throw new Error(`Error on reporting to Google Statistics: ${error}`);
    }
  };

  reportClientEvent = (category, action, label, client) => {
    const url = `${analyticsUrl}?v=1&t=event&tid=${analyticsId}&cid=${client}&ea=${action}&el=${label}&ec=${category}`;

    try {
      return axios.post(url);
    } catch (error) {
      Rollbar.error(error);

      throw new Error(`Error on reporting to Google Statistics: ${error}`);
    }
  };
}

module.exports = AnalyticsReporter;
