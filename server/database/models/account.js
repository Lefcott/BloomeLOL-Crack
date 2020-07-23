const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Account',
  mongoose.Schema(
    {
      UserName: { type: String, required: true },
      Password: { type: String, required: true },
      Level: String,
      FromUrl: String,
      Sold: { type: Boolean, default: false }
    },
    { collection: 'Accounts' }
  )
);
