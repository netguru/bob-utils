const axios = require("axios");
const Rollbar = require("rollbar");

class AnalyticsReporter {
  constructor(trackingId, analyticsUrl) {
    this.trackingId = trackingId;
    this.analyticsUrl = analyticsUrl;
  }

  createEventUrl = (category, action, label, type, client) => {
    const actionUrl = this.createActionUrl(action);
    const categoryUrl = this.createCategoryUrl(category);
    const labelUrl = this.createLabelUrl(label);
    const trackingIdUrl = this.createTrackingIdUrl();
    let clientUrl = "&uid=1";

    if (type === "client") {
      clientUrl = this.createClientUrl(client);
    }

    const submitUrl = `${
      this.analyticsUrl
    }?v=1&t=event${actionUrl}${categoryUrl}${labelUrl}${trackingIdUrl}${clientUrl}`;

    return this.submitEvent(submitUrl);
  };

  createActionUrl = action => {
    return `&ea=${action}`;
  };

  createCategoryUrl = category => {
    return `&ec=${category}`;
  };

  createLabelUrl = label => {
    return `&el=${label}`;
  };

  createTrackingIdUrl = () => {
    return `&tid=${this.trackingId}`;
  };

  createClientUrl = client => {
    return `&cid=${client}`;
  };

  submitEvent = url => {
    try {
      return axios.post(url);
    } catch (error) {
      Rollbar.error(error);
      throw new Error(`Error on reporting to Google Statistics: ${error}`);
    }
  };
}

module.exports = AnalyticsReporter;
