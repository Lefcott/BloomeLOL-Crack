const mongoose = require('mongoose');
const leanDefaults = require('mongoose-lean-defaults');

module.exports = mongoose.model(
  'Product',
  new mongoose.Schema(
    {
      ID: { type: String, required: true, unique: true },
      OwnerID: { type: String, required: true },
      Name: { type: String, required: true },
      BaseUrl: { type: String, required: true },
      Description: String,
      PaymentRemiders: [
        {
          DayOfMonth: Number,
          EmailTemplate: String,
          SMSTemplate: String
        }
      ],
      MonthlyPrice: {
        Value: { type: Number, required: true },
        PaymentCode: String,
        LastPaid: Date,
        MustPayAfter: { type: Date, required: true },
        CurrencyID: { type: String, default: 'ARS' }
      },
      UniquePrice: {
        Value: { type: Number, required: true },
        Paid: { type: Boolean, default: false },
        CurrencyID: { type: String, default: 'ARS' }
      }
    },
    { collection: 'Products' }
  ).plugin(leanDefaults)
);
