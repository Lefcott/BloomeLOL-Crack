const mongoose = require('mongoose');
const leanDefaults = require('mongoose-lean-defaults');

module.exports = mongoose.model(
  'Server',
  new mongoose.Schema(
    {
      Url: { type: String, required: true },
      PageNumber: { type: Number, required: true },
      InitialPageNumber: { type: Number, required: true }
    },
    { collection: 'Servers' }
  ).plugin(leanDefaults)
);
