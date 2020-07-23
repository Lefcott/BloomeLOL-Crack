const proxies = require('../constants/proxies');

let currProxyIndex = 0;
const requestsPerProxy = 7;
let currRequest = 0;

const getProxy = () => {
  const proxy = proxies[currProxyIndex];
  currRequest += 1;
  if (currRequest === requestsPerProxy) {
    currRequest = 0;
    currProxyIndex += 1;
    if (currProxyIndex === proxies.length) currProxyIndex = 0;
  }
  return proxy;
};
const getProxyInfo = proxy => {
  const dotIndex = proxy.indexOf(':');
  return { host: proxy.substr(0, dotIndex), port: proxy.substr(dotIndex + 1) };
};

module.exports = { getProxy, getProxyInfo };
