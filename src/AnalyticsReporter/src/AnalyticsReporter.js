const axios = require('axios');
const Rollbar = require('rollbar');

class AnalyticsReporter {
  constructor(trackingId, analyticsUrl, client) {
    this.trackingId = trackingId;
    this.analyticsUrl = analyticsUrl;
    this.client = client;
  }

  translate = ({
    action: ea,
    category: ec,
    trackingId: tid,
    client: cid,
    label: el
  }) => ({
    v: 1,
    t: "event",
    ea,
    ec,
    el,
    tid,
    cid
  });

  createEventUrl = (category, client, action, label) => {
    const query = {
      action,
      category,
      trackingId: this.trackingId,
      client,
      label
    };

    const queryParams = Object.entries(this.translate(query)).map(
      ([key, value]) => {
        return `${key}=${value}`;
      }
    );

    return queryParams.join("&").slice(0, -1);
  };

  createEvent = category => async (action, label) => {
    try {
      const url = this.createEventUrl(category, this.client, action, label);

      await axios.post(this.analyticsUrl + url);
    } catch (error) {
      Rollbar.error(error);
      throw new Error(`Error on reporting to Google Statistics: ${error}`);
    }
  };
}

module.exports = AnalyticsReporter;
