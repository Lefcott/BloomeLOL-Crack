const getCookies = (cArray = []) => {
  if (!cArray) cArray = [];
  let cookies = '';
  for (let i = 0; i < cArray.length; i += 1) {
    const cookie = cArray[i];
    let endIndex = cookie.indexOf(' ');
    endIndex = endIndex === -1 ? cookie.length : endIndex;
    cookies += `${i > 0 ? ' ' : ''}${cookie.substr(0, endIndex)}`;
  }
  return cookies;
};
const jsonCookie = cookie => {
  const output = {};
  cookie.split(/\s*;\s*/).forEach(pair => {
    pair = pair.split(/\s*=\s*/);
    if (!pair[0]) return;
    output[pair[0]] = pair.splice(1).join('=');
  });
  return output;
};
const strCookie = cookie => {
  const keys = Object.keys(cookie);
  let str = '';
  for (let i = 0; i < keys.length; i += 1) str += `${i === 0 ? '' : ' '}${keys[i]}=${cookie[keys[i]]};`;
  return str;
};
const setCookies = (cookie, set) => {
  cookie = jsonCookie(cookie);
  set = jsonCookie(set);
  cookie = { ...cookie, ...set };
  cookie = strCookie(cookie);
  return cookie;
};

module.exports = { getCookies, jsonCookie, strCookie, setCookies };
