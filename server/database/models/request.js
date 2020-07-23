const mongoose = require('mongoose');
const leanDefaults = require('mongoose-lean-defaults');

module.exports = mongoose.model(
  'Request',
  new mongoose.Schema(
    {
      uid: { type: String, required: true },
      url: { type: String, required: true },
      method: { type: String, required: true },
      failed: { type: Boolean, default: false },
      headers: {},
      body: {},
      params: {},
      response: {
        status: { type: String, default: 'unknown' },
        body: {},
        headers: {}
      },
      createdAt: { type: Date, default: Date.now }
    },
    { collection: 'Requests' }
  ).plugin(leanDefaults)
);
