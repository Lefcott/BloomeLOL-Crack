const { exec } = require('child_process');

const projectDir = require('./server/commons/projectDir');

console.log(`sudo openvpn ${projectDir}/server/vpn/nl-free-08.protonvpn.com.udp.ovpn`);
const ovpnProcess = exec(`openvpn ${projectDir}/server/vpn/nl-free-08.protonvpn.com.udp.ovpn`);
ovpnProcess.stdout.on('data', data => {
  console.log(`stdout: ${data}`);
});
ovpnProcess.stderr.on('data', data => {
  console.log(`stdout: ${data}`);
});
ovpnProcess.on('close', code => {
  console.log(`closing code: ${code}`);
});
