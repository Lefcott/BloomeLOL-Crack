const mongoose = require('mongoose');
const leanDefaults = require('mongoose-lean-defaults');

module.exports = mongoose.model(
  'Proxy',
  new mongoose.Schema(
    {
      IP: { type: String, required: true },
      Active: { type: Boolean, required: true },
      SuccessCount: { type: Number, required: true },
      FailureCount: { type: Number, required: true }
    },
    { collection: 'Proxies' }
  ).plugin(leanDefaults)
);
