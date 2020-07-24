const HttpsProxyAgent = require('https-proxy-agent');

const proxies = require('../constants/proxies');

let currProxyIndex = 0;
const requestsPerProxy = 7;
let currRequest = 0;
let currProxyAgent = new HttpsProxyAgent(`http://${proxies[0]}`);

const getProxyInfo = proxy => {
  const dotIndex = proxy.indexOf(':');
  return { host: proxy.substr(0, dotIndex), port: proxy.substr(dotIndex + 1) };
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

module.exports = { getProxyAgent };
