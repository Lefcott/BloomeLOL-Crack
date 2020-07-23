const mercadopago = require('mercadopago');

const env = require('../../commons/env');
const { product, user, payment } = require('../../database/models');
const rollbar = require('../../commons/rollbar');
const { axios } = require('../../commons/request');
const { largeID } = require('../../commons/passwords');

const baseUrl = env.NGROK_URL || `${env.URL_PREFIX}${env.DOMAIN_NAME}`;
const notification_url = `${baseUrl}/api/mercadopago/notification`;

mercadopago.configure({ access_token: env.MERCADO_PAGO_TOKEN });

module.exports = {
  getAccounts: async (req, res) => {}
};
