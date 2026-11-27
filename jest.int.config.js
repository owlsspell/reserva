const base = require('./package.json').jest;

module.exports = {
  ...base,
  testRegex: '.*\\.int-spec\\.ts$',
};