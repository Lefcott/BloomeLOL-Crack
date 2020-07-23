const headless = require('headless');

const options = {
  display: { width: 1024, height: 980, depth: 32 },
  args: ['-extension', 'RANDR'],
  stdio: 'inherit'
};

headless(options, (err, childProcess, servernum) => {
  // childProcess is a ChildProcess, as returned from child_process.spawn()
  console.log('Xvfb running on server number', servernum);
  // console.log('Xvfb pid', childProcess.pid);
  console.log('err should be null', err);
});
