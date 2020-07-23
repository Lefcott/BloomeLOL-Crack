const mongoose = require('mongoose');

module.exports = mongoose.model(
  'User',
  mongoose.Schema(
    {
      Email: { type: String, required: true },
      Phone: { type: String, required: true },
      ConfirmID: String,
      Confirmed: { type: Boolean, default: false },
      Name: { type: String, required: true },
      Surname: String,
      Password: { type: String, required: true },
      Language: String,
      ProductIDs: [String]
    },
    { collection: 'Users' }
  )
);
