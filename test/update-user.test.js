/* Copyright (c) 2010-2013 Richard Rodger */
'use strict'

var Seneca = require('seneca')

var _ = require('lodash')

var Lab = require('lab')
var Code = require('code')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before
var expect = Code.expect

var si = Seneca()
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

suite('seneca-user update suite tests ', function () {
  before({}, function (done) {
    si.ready(function (err) {
      if (err) return process.exit(!console.error(err))
      done()
    })
  })

  test('user/register test user1', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user1Data), function (err, data) {
      expect(err).to.not.exist()
      expect(data.nick).to.not.exist()
      // FIXME: check if good test
      done(err)
    })
  })

  test('user/register test user2', function (done) {
    si.act(_.extend({role: 'user', cmd: 'register'}, user2Data), function (err, data) {
      expect(err).to.not.exist()
      expect(data.nick).to.not.exist()
      // FIXME: cf test up
      done(err)
    })
  })

  test('user/update test', function (done) {
    si.act({role: 'user', cmd: 'update', nick: user1Data.nick, otherProp: 'a'}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      expect(data.user.otherProp).to.equal('a')
      done(err)
    })
  })

  test('user/update test new nick', function (done) {
    si.act({role: 'user', cmd: 'update', nick: user1Data.nick, orig_nick: user2Data.nick}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      done(err)
    })
  })

  test('user/get user test', function (done) {
    si.act({role: 'user', get: 'user', nick: user1Data.nick}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      expect(data.user.nick).to.be.equal(user1Data.nick) // check?
      done(err)
    })
  })

  test('user/delete user test', function (done) {
    si.act({role: 'user', cmd: 'delete', nick: user1Data.nick}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      expect(data.why).to.equal('user-not-found')
      done(err)
    })
  })
})
