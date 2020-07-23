const fs = require('fs');

const projectDir = require('../commons/projectDir');
const { axios } = require('../commons/request');
const proxies = require('../constants/proxies');

const { getUsers } = require('./get_users');

const writeResult = data => fs.writeFileSync(`${projectDir}/test.txt`, data);

// (async () => {
//   const url = 'https://las.op.gg/ranking/ladder/page=49';
//   const response = await axios({
//     options: { url },
//     persist: true
//   });
//   if (!response) return;
//   console.log('Getting users from', url);
//   writeResult(response.body);
//   const users = getUsers(response.body);
//   console.log('users', users);
// })();
