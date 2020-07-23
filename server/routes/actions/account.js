const env = require('../../commons/env');
const { account } = require('../../database/models');
const rollbar = require('../../commons/rollbar');
const { axios } = require('../../commons/request');

const baseUrl = env.NGROK_URL || `${env.URL_PREFIX}${env.DOMAIN_NAME}`;
const notification_url = `${baseUrl}/api/mercadopago/notification`;

module.exports = {
  getAccounts: async (req, res) => {}
};
