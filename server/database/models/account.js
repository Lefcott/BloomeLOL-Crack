const mongoose = require('mongoose');
const leanDefaults = require('mongoose-lean-defaults');

module.exports = mongoose.model(
  'Account',
  new mongoose.Schema(
    {
      UserName: { type: String, required: true },
      Password: { type: String, required: true },
      Level: String,
      FromUrl: String,
      Sold: { type: Boolean, default: false }
    },
    { collection: 'Accounts' }
  ).plugin(leanDefaults)
);
