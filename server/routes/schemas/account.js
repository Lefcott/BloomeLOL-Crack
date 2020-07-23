const joi = require('@hapi/joi');

const { sessionMiddleware } = require('../../commons/middlewares');
require('../../commons/env');

module.exports = {
  getAccounts: {
    method: 'get',
    paths: '/accounts',
    // middlewares: sessionMiddleware,
    // domains: process.env.DOMAIN_NAME,
    admin: true,
    errorMessage: 'Bad parameters'
  }
};
