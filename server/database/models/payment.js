const mongoose = require('mongoose');
const moment = require('moment');
const leanDefaults = require('mongoose-lean-defaults');

module.exports = mongoose.model(
  'Payment',
  new mongoose.Schema(
    {
      ID: String,
      Reference: { type: String, required: true, unique: true },
      ProductID: { type: String, required: true },
      Active: { type: Boolean, default: false },
      Status: String,
      Paid: Number,
      CurrencyID: String,
      CreatedAt: { type: Date, default: moment() }
    },
    { collection: 'Payments' }
  ).plugin(leanDefaults)
);
