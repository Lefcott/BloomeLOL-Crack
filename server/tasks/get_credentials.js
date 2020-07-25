const { axios } = require('../commons/request');
const { haveSameElements } = require('../commons/arrays');
const { server } = require('../database/models');
const { getPasswordSet } = require('../constants/tests');

const { formatUsers } = require('./format_users');

const lastUserLists = {};

/**
 * Get an array of { username, passowrd } pairs
 * @param {*} Server
 * @returns {Promise<{ url: string, pairs: { username: string, password: string }[] }>}
 */
const getCredentials = async Server => {
  if (!lastUserLists[Server._id]) lastUserLists[Server._id] = [];
  const url = Server.Url.replace(/\{\{PageNumber\}\}/g, Server.PageNumber);
  const userResp = await axios({ options: { url } });
  if (!userResp) return;
  const users = formatUsers(userResp.body);
  if (users.length && haveSameElements(users, lastUserLists[Server._id])) {
    console.log('Repeated User Elements', users);
    Server.PageNumber = Server.InitialPageNumber;
    server.update({ _id: Server._id }, { PageNumber: Server.PageNumber });
    return getCredentials(Server);
  }
  Server.PageNumber += 1;
  lastUserLists[Server._id] = users;
  const pairs = [];
  for (let i = 0; i < users.length; i += 1) {
    const passwords = getPasswordSet(users[i]);
    for (let ii = 0; ii < passwords.length; ii += 1)
      pairs.push({ username: users[i], password: passwords[ii] });
  }
  server.update({ _id: Server._id }, { $inc: { PageNumber: 1 } });
  return { pairs, url };
};

module.exports = { getCredentials };
