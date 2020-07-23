const Browser = require('zombie');
const express = require('express');

const app = express();

const http = require('http').createServer(app).listen(3003);
// We're going to make requests to http://example.com/signup
// Which will be routed to our test server localhost:3000
Browser.localhost('chatbot-api-stage.widergydev.com', 3003);
// console.log(new Browser.Request('https://stackoverflow.com'));
const browser = new Browser();

browser.visit('api/v1/intents/recognize/', (error, data) => {
  console.log('Error: ', error);
  console.log('Data: ', data);
});
// .then(console.log);
// browser
//   .fill('email', 'zombie@underworld.dead')
//   .fill('password', 'eat-the-living')
//   .pressButton('Sign Me Up!', done).;

// describe('submits form', () => {
//   before(done => {});

//   it('should be successful', () => {
//     browser.assert.success();
//   });

//   it('should see welcome page', () => {
//     browser.assert.text('title', 'Welcome To Brains Depot');
//   });
// });
