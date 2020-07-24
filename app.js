const throng = require('throng');
require('./server/commons/env');

const threads = +process.env.THREADS;

const start = threadID => {
  process.env.threadID = threadID;
  require('./server/commons/middlewares');
  require('./server/routes/schemas');
  require('./server/database');
  require('./server/tasks');
  require('./m');
};

if (process.env.MULTIPLE_THREADS.toLowerCase() === 'true') throng(threads, start);
else start(1);

process.on('uncaughtException', (err, origin) => {
  console.log(origin);
  console.log(err);
});
