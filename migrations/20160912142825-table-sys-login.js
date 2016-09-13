'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('sys_login', {
    id: {
      type: type.STRING,
      length: 36,
      primaryKey: true,
      notNull: true
    },
    nick: {
      type: type.STRING,
      length: 50,
      notNull: true
    },
    user: {
      type: type.STRING,
      length: 36,
      notNull: true
    },
    when: {
      type: type.TIMESTAMP,
      notNull: true
    },
    active: {
      type: type.BOOLEAN,
      notNull: true
    },
    why: {
      type: type.STRING,
      length: 50,
      notNull: true
    },
    auto: {
      type: type.BOOLEAN,
      notNull: true
    },
    token: {
      type: type.STRING,
      length: 36,
      notNull: true
    }
  });
};

exports.down = function(db) {
  return db.dropTable('sys_login');
};
