var program = require('commander');

var p = program
  .option('--up', 'Migrate up')
  .option('--down', 'Migrate down')
  .option('--create', 'Create empty migration')
  .option('--count', 'Migrate particular number of migration')
  .option('--revert', 'Revert last migration')
  .parse(process.argv);


var keys = ['up', 'down', 'create', 'count', 'revert'];
for (var i = keys.length - 1; i >= 0; i--) {
  var k = keys[i];
  module.exports[k] = p[k] || process.env['npm_config_' + k];
};