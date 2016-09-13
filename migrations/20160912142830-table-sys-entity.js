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
  return db.createTable('sys_entity', {
    id: {
      type: type.STRING,
      length: 36,
      primaryKey: true,
      notNull: true
    },
    zone: {
      type: type.SMALLINT
    },
    base: {
      type: type.STRING,
      length: 50,
      notNull: true
    },
    name: {
      type: type.STRING,
      length: 50,
      notNull: true
    },
    fields: {
      type: type.TEXT,
      notNull: true
    },
    seneca: {
      type: type.TEXT,
      notNull: true
    }
  });
};

exports.down = function(db) {
  return db.dropTable('sys_entity');
};
