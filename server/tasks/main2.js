/* eslint-disable no-await-in-loop */

const { server } = require('../database/models');
const { MACHINE_INDEX, THREADS } = require('../commons/env');

const { getCredentials } = require('./get_credentials');
const { checkAndStore } = require('./check_credentials');

const activeServers = {}; // Remove elements for stop execution

const parallelProcess = async Server => {
  if (!activeServers[Server._id]) return;
  const { pairs, url } = await getCredentials(Server);
  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i];
    await checkAndStore(pair.username, pair.password, url);
  }
  parallelProcess(Server);
};

const init = async () => {
  const Servers = await server.get({});
  if (!Servers) return init();
  const programInterval = 5000;
  const threadIndex = +process.env.threadID - 1;
  const machineIndex = +MACHINE_INDEX;
  for (let i = 0; i < Servers.length; i += 1) {
    activeServers[Servers[i]._id] = true;
    const index = +THREADS * machineIndex * Servers.length + threadIndex * Servers.length + i;
    console.log('machine', machineIndex, 'thread', threadIndex, 'server', i, ':', index);
    setTimeout(parallelProcess, index * programInterval || 2, Servers[i]);
  }
};

init();
