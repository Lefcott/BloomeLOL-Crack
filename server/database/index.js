const mongoose = require('mongoose');

const { MONGODB_URI } = require('../commons/env');

const { connect } = mongoose;

mongoose.set('useCreateIndex', true);
connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, async error => {
  if (error) return console.error(error);
  console.log('Connected to MongoDB!');
});
