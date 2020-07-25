const regex = /\/summoner\/userName=.+\n/g;
const prefix = '/summoner/userName=';
/**
 * Parse Users from HTML page
 * @param {string} html
 */
const formatUsers = html => {
  const matches = html.match(regex);
  const users = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const quoteIndex = Math.max(match.indexOf('"'), match.indexOf("'"));
    if (quoteIndex === -1) return;
    let user = match.substring(prefix.length, quoteIndex);
    user = user.replace(/\+/g, ' ');
    user = decodeURIComponent(user);
    users.push(user);
  }
  return users;
};

module.exports = { formatUsers };
