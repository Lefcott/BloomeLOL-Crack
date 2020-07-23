const { NODE_ENV, MERCADO_PAGO_TOKEN } = require('../commons/env');

const interval = 10000;

const execute = () => setTimeout(async () => {}, interval);

if (NODE_ENV !== 'localhost' && +process.env.threadID === 1) execute();
