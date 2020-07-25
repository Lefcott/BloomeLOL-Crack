const HttpsProxyAgent = require('https-proxy-agent');

const proxies = require('../constants/proxies');
const { proxy } = require('../database/models');

let currProxyIndex = 0;
const requestsPerProxy = 7;
let currRequest = requestsPerProxy;
let currProxyAgent = new HttpsProxyAgent(`http://${proxies[0]}`);
let Proxy;
const getProxyInfo = pr => {
  const dotIndex = pr.indexOf(':');
  return { host: pr.substr(0, dotIndex), port: pr.substr(dotIndex + 1) };
};

const getProxyAgent = () => {
  currRequest += 1;
  if (currRequest === requestsPerProxy) {
    currRequest = 0;
    currProxyIndex += 1;
    if (currProxyIndex === proxies.length) currProxyIndex = 0;
    currProxyAgent = new HttpsProxyAgent(`http://${proxies[currProxyIndex]}`);
  }
  return currProxyAgent;
};
const getProxy = async (forceChangeProxy = false) => {
  if (currRequest === requestsPerProxy || forceChangeProxy) {
    Proxy = await proxy.get({ Active: true }, { sort: { _id: 1 }, skip: currProxyIndex, limit: 1 });
    if (!Proxy) return new Promise(resolve => setTimeout(() => resolve(getProxy()), 1000));
    [Proxy] = Proxy;
    currRequest = 0;
    if (!Proxy) {
      currProxyIndex = 0;
      return getProxy();
    }
    currProxyIndex += 1;
    Proxy.agent = new HttpsProxyAgent(`http://${proxies[currProxyIndex]}`);
  }
  currRequest += 1;
  return Proxy;
};

module.exports = { getProxyAgent, getProxy };
