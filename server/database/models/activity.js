const mongoose = require('mongoose');
const leanDefaults = require('mongoose-lean-defaults');

module.exports = mongoose.model(
  'Activity',
  new mongoose.Schema(
    {
      PaymentReference: { type: String, required: true },
      PaymentStatus: String,
      Name: String,
      Email: String,
      Subject: String,
      Message: String
    },
    { collection: 'Activities' }
  ).plugin(leanDefaults)
);
