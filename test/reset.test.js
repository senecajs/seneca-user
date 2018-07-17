/* Copyright (c) 2010-2013 Richard Rodger */
'use strict'

var Seneca = require('seneca')
var SenecaUse = require('./senecaUse')

var _ = require('lodash')

var Lab = require('lab')
var Code = require('code')
var lab = (exports.lab = Lab.script())
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
  active: true
}

var user2Data = {
  nick: 'nick2',
  email: 'nick2@example.com',
  password: 'test2test',
  active: true
}

var user3Data = {
  nick: 'nick3',
  email: 'nick3@example.com',
  password: 'test3test',
  active: false
}

suite('seneca-user reset suite tests ', function() {
  before({}, function(done) {
    si.ready(function(err) {
      if (err) return process.exit(!console.error(err))
      done()
    })
  })

  test('user/register test', function(done) {
    si.act(_.extend({ role: 'user', cmd: 'register' }, user1Data), function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.user.nick).to.equal(user1Data.nick)
      done(err)
    })
  })

  test('user/register test', function(done) {
    si.act(_.extend({ role: 'user', cmd: 'register' }, user2Data), function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.user.nick).to.equal(user2Data.nick)
      done(err)
    })
  })

  test('user/register test', function(done) {
    si.act(_.extend({ role: 'user', cmd: 'register' }, user3Data), function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.user.nick).to.equal(user3Data.nick)
      done(err)
    })
  })

  var resetId
  test('user/create_reset unknown user test', function(done) {
    si.act(
      { role: 'user', cmd: 'create_reset', nick: user1Data.nick },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        expect(data.reset.id).to.exist()
        resetId = data.reset.token
        done(err)
      }
    )
  })

  test('user/create_reset unknown user test', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'execute_reset',
        token: resetId,
        password: 'x',
        repeat: 'x'
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        done(err)
      }
    )
  })

  test('user/login user test', function(done) {
    si.act(
      { role: 'user', cmd: 'login', nick: user1Data.nick, password: 'x' },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        expect(data.user).to.exist()
        done(err)
      }
    )
  })

  test('/user/create_reset fails if user inactive', function(done) {
    si.act(
      { role: 'user', cmd: 'create_reset', nick: user3Data.nick },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        expect(data.why).to.equal('not-active')
        done(err)
      }
    )
  })
})
