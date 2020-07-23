const moment = require('moment');

const { payment, product } = require('../database/models');
const { axios } = require('../commons/request');
const { NODE_ENV, MERCADO_PAGO_TOKEN } = require('../commons/env');

const interval = 10000;
const paymentTypes = ['unique', 'monthly'];

const schedule = () =>
  setTimeout(async () => {
    const payments = await payment.get({ Active: true });
    if (!payments || !payments.length) return schedule();
    let responses = [];
    for (let i = 0; i < payments.length; i += 1) {
      const pay = payments[i];
      responses.push(
        axios({
          options: {
            url: 'https://api.mercadopago.com/v1/payments/search',
            params: { external_reference: pay.Reference, access_token: MERCADO_PAGO_TOKEN }
          }
        })
      );
    }
    responses = await Promise.all(responses);
    for (let i = 0; i < payments.length; i += 1) {
      const pay = payments[i];
      if (!responses[i] || responses[i].status !== 200) continue;
      if (!responses[i].body.results || !responses[i].body.results.length) continue;
      const [{ status, transaction_amount, currency_id }] = responses[i].body.results;
      payment.update(
        { _id: pay._id },
        {
          Status: status,
          Paid: transaction_amount,
          CurrencyID: currency_id,
          Active: !['approved', 'rejected', 'cancelled', 'refunded', 'charged_back'].includes(
            status.toLowerCase()
          )
        }
      );
      if (status === 'approved') {
        const [paymentType] = pay.Reference.split('-');
        let update;
        if (paymentTypes.includes(paymentType)) {
          if (paymentType === 'unique') update = { 'UniquePrice.Paid': true };
          else if (paymentType === 'monthly')
            // TODO model of monthly payments
            update = {
              'MonthlyPrice.PaymentCode': '',
              'MonthlyPrice.LastPaid': moment()
            };
          product.update({ ID: pay.ProductID }, update);
        }
      }
    }
    schedule();
  }, interval);

if (NODE_ENV !== 'localhost' && +process.env.threadID === 1) schedule();
