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
  salt: 'something',
  active: true
}

suite('seneca-user login and token validation suite tests ', function() {
  before({}, function(done) {
    si.ready(function(err) {
      if (err) return process.exit(!console.error(err))
      si.act(_.extend({ role: 'user', cmd: 'register' }, user1Data), done)
    })
  })

  test('user/login validate token test', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
        password: user1Data.password
      },
      function(err, data) {
        if (err) return done(err)
        si.act({ role: 'user', cmd: 'auth', token: data.login.token }, function(
          err,
          data_auth
        ) {
          expect(err).to.not.exist()
          expect(data_auth.ok).to.be.true()
          expect(data.user.nick).to.equal(data_auth.user.nick)
          done(err)
        })
      }
    )
  })

  test('user/login validate token after logout', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
        password: user1Data.password
      },
      function(err, data) {
        if (err) return done(err)
        si.act(
          { role: 'user', cmd: 'logout', token: data.login.token },
          function(err, data_logout) {
            if (err) return done(err)
            si.act(
              { role: 'user', cmd: 'auth', token: data.login.token },
              function(err, data_auth) {
                expect(err).to.not.exist()
                expect(data_auth.ok).to.be.false()
                expect(data_auth.why).to.equal('login-inactive')
                done(err)
              }
            )
          }
        )
      }
    )
  })
})
