/* Copyright (c) 2010-2013 Richard Rodger */
'use strict'

var Seneca = require('seneca')

var Assert = require('chai').assert
var _ = require('lodash')

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before

var si = Seneca()
si.use('../user')

var user1Data = {
  nick: 'nick1',
  email: 'nick1@example.com',
  password: 'test1test',
  salt: 'something',
  active: true
}

var user2Data = {
  nick: 'nick2',
  email: 'nick2@example.com',
  password: 'test2test',
  salt: 'something',
  active: true
}

suite('seneca-user activate/deactivate suite tests ', function () {
  before({}, function (done) {
    si.ready(function (err) {
      if (err) return process.exit(!console.error(err))
      done()
    })
  })

  test('user/register test', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user1Data), function (err, data) {
      Assert.isNull(err)
      Assert.equal(user1Data.nick, data.user.nick)
      done(err)
    })
  })

  test('user/register test', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user2Data), function (err, data) {
      Assert.isNull(err)
      Assert.equal(user2Data.nick, data.user.nick)
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      Assert.isNull(err)
      Assert.ok(data.ok)
      done(err)
    })
  })

  test('user/disable user test', function (done) {
    si.act({role: 'user', cmd: 'deactivate', nick: user1Data.nick}, function (err, data) {
      Assert.isNull(err)
      Assert.ok(data.ok)
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      Assert.isNull(err)
      Assert.notOk(data.ok)
      Assert.equal('not-active', data.why)
      done(err)
    })
  })

  test('user/enable user test', function (done) {
    si.act({role: 'user', cmd: 'activate', nick: user1Data.nick}, function (err, data) {
      Assert.isNull(err)
      Assert.ok(data.ok)
      done(err)
    })
  })

  test('user/verify password user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      Assert.isNull(err)
      Assert.ok(data.ok)
      Assert(data.user)
      Assert(data.user.pass)
      si.act({role: 'user', cmd: 'verify_password', proposed: user1Data.password, salt: user1Data.salt, pass: data.user.pass}, function (err, data) {
        Assert.isNull(err)
        Assert.ok(data.ok)
        done(err)
      })
    })
  })

  test('user/incorrect verify password user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      Assert.isNull(err)
      Assert.ok(data.ok)
      Assert(data.user)
      Assert(data.user.pass)
      si.act({role: 'user', cmd: 'verify_password', proposed: user1Data.password + '1', salt: user1Data.salt, pass: data.user.pass}, function (err, data) {
        Assert.isNull(err)
        Assert.notOk(data.ok)
        done(err)
      })
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      Assert.isNull(err)
      Assert.ok(data.ok)
      done(err)
    })
  })

  test('user/disable unknown user test', function (done) {
    si.act({role: 'user', cmd: 'deactivate'}, function (err, data) {
      Assert.isNull(err)
      Assert.notOk(data.ok)
      Assert.equal('cannot-identify-user', data.why)
      done(err)
    })
  })

  test('user/enable unknown user test', function (done) {
    si.act({role: 'user', cmd: 'activate'}, function (err, data) {
      Assert.isNull(err)
      Assert.notOk(data.ok)
      Assert.equal('cannot-identify-user', data.why)
      done(err)
    })
  })
})
