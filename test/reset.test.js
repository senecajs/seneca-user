/* Copyright (c) 2010-2019 Richard Rodger and other contributors, MIT License. */
'use strict'

var Seneca = require('seneca')
const Shared = require('./shared')

const Code = require('@hapi/code')
const Lab = require('@hapi/lab')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var suite = lab.suite
var expect = Code.expect
var it = Shared.make_it(lab)

var si = Shared.seneca_instance({ user: { test: true } })

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
  it('user/register test', function(done) {
    si.act(
      Object.assign({ role: 'user', cmd: 'register' }, user1Data),
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.user.nick).to.equal(user1Data.nick)
        done(err)
      }
    )
  })

  it('user/register test', function(done) {
    si.act(
      Object.assign({ role: 'user', cmd: 'register' }, user2Data),
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.user.nick).to.equal(user2Data.nick)
        done(err)
      }
    )
  })

  it('user/register test', function(done) {
    si.act(
      Object.assign({ role: 'user', cmd: 'register' }, user3Data),
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.user.nick).to.equal(user3Data.nick)
        done(err)
      }
    )
  })

  var resetId
  it('user/create_reset unknown user test', function(done) {
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

  it('user/create_reset unknown user test', function(done) {
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

  it('user/login user test', function(done) {
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

  it('/user/create_reset fails if user inactive', function(done) {
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
