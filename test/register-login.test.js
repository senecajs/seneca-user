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

// NOTE: uses external process as part of test
var si = Shared.seneca_instance()

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

var user_log = []

si.on('act-out', function(msg, res) {
  if ('user' === msg.role) {
    user_log.push([msg, res])
  }
})

suite('seneca-user register-login suite tests ', function() {
  it('user/register test', function(done) {
    si.act(
      Object.assign({ role: 'user', cmd: 'register' }, user1Data),
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.user.repeat).to.not.exist()
        expect(user1Data.nick, data.nick).to.exist()

        var d = new Date()
        d.setTime(data.user.t_c)
        expect(d.toISOString()).equal(data.user.when)

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

  it('user/login test', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
        password: user1Data.password
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.exist()
        expect(data.why).to.equal('password')
        expect(data.login).to.exist()
        expect(data.user).to.exist()
        expect(data.login.repeat).to.not.exist()
        expect(data.user.repeat).to.not.exist()
        expect(data.login.token).to.exist()
        done(err)
      }
    )
  })

  it('user/register unique nick test', function(done) {
    si.act(
      Object.assign({ role: 'user', cmd: 'register' }, user1Data),
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        expect(data.why).to.equal('nick-exists')
        done(err)
      }
    )
  })

  it('user/register password mismatch test', function(done) {
    si.act(
      Object.assign(
        { role: 'user', cmd: 'register' },
        { nick: 'npm', password: 'a', repeat: 'b' }
      ),
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        expect(data.why).to.equal('password_mismatch')
        done(err)
      }
    )
  })

  it('user/login invalid user test', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick + 'x',
        password: user1Data.password
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        expect(data.why).to.equal('user-not-found')
        done(err)
      }
    )
  })

  it('user/login invalid password test', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
        password: user1Data.password + 'x'
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        expect(data.why).to.equal('invalid-password')
        done(err)
      }
    )
  })

  it('user_log', function(fin) {
    expect(user_log.length).above(0)
    fin()
    //console.log(user_log)
  })
})
