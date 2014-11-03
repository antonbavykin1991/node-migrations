var assert = require('assert'),
  path = require('path'),
  fs = require('fs'),
  async = require('async');

var MetaDecorator = require('./meta/');

const MODE_UP = 'up';
const MODE_DOWN = 'down';


function Migrant(opts) {
  this.opts = opts;
  this.meta = new MetaDecorator(opts.meta);
}


Migrant.prototype.migrate = function(mode, count, cb) {
  var self = this;
  this.list(mode, count, function(err, migrations) {
    if (err) return cb(err);
    async.mapSeries(migrations, self.migrateSingle.bind(self, mode), cb);
  });
};


Migrant.prototype.up = function(count, cb) {
  this.migrate(MODE_UP, count, cb);
};


Migrant.prototype.down = function(count, cb) {
  this.migrate(MODE_DOWN, count, cb);
};


Migrant.prototype.list = function(mode, count, cb) {
  var self = this;
  this.meta.get(function(err, data) {
    if (err) return cb(err);

    existing = data.migrations.map(function(i) {
      return i.filename
    }).sort()

    if (mode === MODE_DOWN)
      return cb(null, existing.reverse().slice(0, count));

    // get a list of available migrations in the directory
    var migrations = fs.readdirSync(self.opts.dir).sort().filter(function(filename) {
      return ~['.js', '.node', '.coffee'].indexOf(path.extname(filename))
        && filename.match(/^\d+/);
    });

    // reject ones that have been run
    if (data && data.migrations)
      migrations = migrations.filter(function(filename) {
        return !existing.some(function(item) {
          return item === filename;
        });
      });

    cb(null, migrations.slice(0, count));
  });
};


Migrant.prototype.migrateSingle = function(mode, filename, cb) {
  var self = this;
  var migration = require(path.join(this.opts.dir, filename));

  this.log(filename, mode);
  async.series([
    migration[mode], // run migration
    self.meta[mode].bind(self.meta, filename) // save progress
  ], function(err) {
    if (err) return cb(err)
    self.log(filename, 'complete', true);
    cb();
  });
};


Migrant.prototype.log = function(key, msg, delim) {
  if (this.opts.verbose) {
    console.log('  \033[90m%s :\033[0m \033[36m%s\033[0m', key, msg);
    if (delim)
      console.log('')
  }
};


module.exports = Migrant;