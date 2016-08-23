/* Copyright (c) 2010-2013 Richard Rodger */
'use strict'

var Seneca = require('seneca')
var SenecaUse = require('./senecaUse')

var _ = require('lodash')

var Lab = require('lab')
var Code = require('code')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before
var expect = Code.expect

var si = Seneca()

SenecaUse(si)

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
      expect(err).to.not.exist()
      expect(data.user.nick).to.equal(user1Data.nick)
      done(err)
    })
  })

  test('user/register test', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user2Data), function (err, data) {
      expect(err).to.not.exist()
      expect(data.user.nick).to.equal(user2Data.nick)
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  test('user/disable user test', function (done) {
    si.act({role: 'user', cmd: 'deactivate', nick: user1Data.nick}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      expect(data.why).to.equal('not-active')
      done(err)
    })
  })

  test('user/enable user test', function (done) {
    si.act({role: 'user', cmd: 'activate', nick: user1Data.nick}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  test('user/verify password user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      expect(data.user).to.be.exist()
      expect(data.user.pass).to.exist()
      si.act({role: 'user', cmd: 'verify_password', proposed: user1Data.password, salt: user1Data.salt, pass: data.user.pass}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        done(err)
      })
    })
  })

  test('user/incorrect verify password user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      expect(data.user).to.exist()
      expect(data.user.pass).to.exist()
      si.act({role: 'user', cmd: 'verify_password', proposed: user1Data.password + '1', salt: user1Data.salt, pass: data.user.pass}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        done(err)
      })
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  test('user/disable unknown user test', function (done) {
    si.act({role: 'user', cmd: 'deactivate'}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      expect(data.why).to.equal('cannot-identify-user')
      done(err)
    })
  })

  test('user/enable unknown user test', function (done) {
    si.act({role: 'user', cmd: 'activate'}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      expect(data.why).to.equal('cannot-identify-user')
      done(err)
    })
  })
})
