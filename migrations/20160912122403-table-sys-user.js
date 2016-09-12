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
  return db.createTable('sys_user', {
    id: {
      type: type.STRING,
      length: 36,
      unique: true,
      notNull: true
    },
    nick: {
      type: type.STRING,
      length: 255,
      notNull: true,
      unique: true
    },
    email: {
      type: type.STRING,
      length: 255,
      notNull: true,
      unique: true
    },
    name: {
      type: type.STRING,
      length: 255
    },
    active: {
      type: type.BOOLEAN,
      notNull: true
    },
    when: {
      type: type.TIMESTAMP,
      notNull: true
    },
    salt: {
      type: type.STRING,
      length: 64,
      notNull: true
    },
    pass: {
      type: type.STRING,
      length: 64,
      notNull: true
    },
    confirmed: {
      type: type.BOOLEAN
    },
    confirmcode: {
      type: type.STRING,
      length: 255
    },
    failed_login_count: {
      type: type.SMALLINT,
      defaultValue: 0,
      notNull: true
    }
  });
};

exports.down = function(db) {
  return db.dropTable('sys_user');
};
