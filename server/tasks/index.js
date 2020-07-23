const fs = require('fs');

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.slice(-3) === '.js')
  .forEach(file => require(`./${file}`));
