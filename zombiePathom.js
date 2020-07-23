const Browser = require('zombie-phantom');

const browser = new Browser({
  site: 'http://auth.riotgames.com'
});

browser.visit('/login', () => {
  browser.text('h1', text => {
    console.log(text);
  });
});
