/* Copyright (c) 2010-2013 Richard Rodger */
"use strict";

var seneca = require('seneca')

var assert = require('chai').assert
var _ = require('lodash')

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite;
var test = lab.test;
var before = lab.before;

var si = seneca()
si.use('../user')

var user1Data = {
  nick: 'nick1',
  email: 'nick1@example.com',
  password: 'test1test',
  active: true
}

var user2Data = {
  nick: 'nick2',
  email: 'nick2@example.com',
  password: 'test2test',
  active: true
}

var token

suite('seneca-user reset suite tests ', function () {
  before({}, function (done) {
    si.ready(function (err) {
      if (err) return process.exit(!console.error(err));
      done()
    })
  })

  test('user/register test', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user1Data), function (err, data) {
      assert.isNull(err)
      assert(user1Data.nick, data.nick)
      done(err)
    })
  })

  test('user/register test', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user2Data), function (err, data) {
      assert.isNull(err)
      assert(user2Data.nick, data.nick)
      done(err)
    })
  })

  var resetId
  test('user/create_reset unknown user test', function (done) {
    si.act({role: 'user', cmd: 'create_reset', nick: user1Data.nick }, function (err, data) {
      assert.isNull(err)
      assert.ok(data.ok)
      assert(data.reset.id)
      resetId = data.reset.id
      done(err)
    })
  })

  test('user/create_reset unknown user test', function (done) {
    si.act({role: 'user', cmd: 'execute_reset', token: resetId, password: 'x', repeat: 'x' }, function (err, data) {
      assert.isNull(err)
      assert.ok(data.ok)
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: 'x'}, function (err, data) {
      assert.isNull(err)
      assert.ok(data.ok)
      assert(data.user)
      done(err)
    })
  })

})
