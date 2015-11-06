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
  repeat: 'test1test',
  active: true
}

var user2Data = {
  nick: 'nick2',
  email: 'nick2@example.com',
  password: 'test2test',
  repeat: 'test2test',
  active: true
}

var token

suite('seneca-user register-login suite tests ', function () {
  before({}, function (done) {
    si.ready(function (err) {
      if (err) return process.exit(!console.error(err));
      done()
    })
  })

  test('user/register test', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user1Data), function (err, data) {
      assert.isNull(err)
      assert(!data.user.repeat, "Repeat should not exists")
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

  test('user/login test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      assert.isNull(err)
      assert(data.ok)
      assert.equal('password', data.why)
      assert(data.login)
      assert(data.user)
      assert(!data.login.repeat, "Repeat should not exists")
      assert(!data.user.repeat, "Repeat should not exists")
      assert(data.login.token)
      token = data.login.token
      done(err)
    })
  })

  test('user/register unique nick test', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user1Data), function (err, data) {
      assert.isNull(err)
      assert.ok(!data.ok)
      assert.equal('nick-exists', data.why)
      done(err)
    })
  })

  test('user/register password mismatch test', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, {nick: 'npm', password: 'a', repeat: 'b'}), function (err, data) {
      assert.isNull(err)
      assert.ok(!data.ok)
      assert.equal('password_mismatch', data.why)
      done(err)
    })
  })

  test('user/login invalid user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick + 'x', password: user1Data.password}, function (err, data) {
      assert.isNull(err)
      assert.ok(!data.ok)
      assert.equal('user-not-found', data.why)
      done(err)
    })
  })

  test('user/login invalid password test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password + 'x'}, function (err, data) {
      assert.isNull(err)
      assert.ok(!data.ok)
      assert.equal('invalid-password', data.why)
      done(err)
    })
  })

})
