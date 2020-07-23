/* eslint-disable global-require */
require('./env');

module.exports = require('rollbar-grouping')({
  rollbar: {
    accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
    environment: process.env.NODE_ENV,
    verbose: true,
    itemsPerMinute: 500,
    maxItems: 500000
  },
  eventTimeout: +process.env.ROLLBAR_EVENT_TIMEOUT
});
