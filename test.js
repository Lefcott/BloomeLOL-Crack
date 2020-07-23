const phantomjs = require('phantomjs-prebuilt');
const webdriverio = require('webdriverio');

const wdOpts = {
  desiredCapabilities: { browserName: 'phantomjs' },
  capabilities: { browserName: 'phantomjs' }
};

phantomjs.run('--webdriver=4444').then(program => {
  webdriverio
    .remote(wdOpts)
    .init()
    .url('https://chatbot-api-stage.widergydev.com')
    .getTitle()
    .then(title => {
      console.log('Got title');
      console.log(title); // 'Mozilla Developer Network'
      program.kill(); // quits PhantomJS
    });
});
