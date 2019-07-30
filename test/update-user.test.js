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

var si = Shared.seneca_instance()



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

suite('seneca-user update suite tests ', function() {

  it('user/register test user1', function(done) {
    si.act(Object.assign({ role: 'user', cmd: 'register' }, user1Data), function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.user.nick).to.equal(user1Data.nick)
      done(err)
    })
  })

  it('user/register test user2', function(done) {
    si.act(Object.assign({ role: 'user', cmd: 'register' }, user2Data), function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.user.nick).to.equal(user2Data.nick)
      done(err)
    })
  })

  it('user/update test', function(done) {
    si.act(
      { role: 'user', cmd: 'update', nick: user1Data.nick, otherProp: 'a' },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        expect(data.user.otherProp).to.equal('a')
        done(err)
      }
    )
  })

  it('user/update test new nick', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'update',
        nick: user1Data.nick,
        orig_nick: user2Data.nick
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        done(err)
      }
    )
  })

  it('user/get user test', function(done) {
    si.act({ role: 'user', get: 'user', nick: user1Data.nick }, function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      expect(data.user.nick).to.be.equal(user1Data.nick) // check?
      done(err)
    })
  })

  it('user/get user test email', function(done) {
    si.act({ role: 'user', get: 'user', email: user2Data.email }, function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      expect(data.user.email).to.be.equal(user2Data.email) // check?
      done(err)
    })
  })

  // now update user based on orig_nick and also change its password
  it('user/update test new nick and password', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'update',
        name: 'some name',
        orig_nick: user1Data.nick,
        password: 'p1',
        repeat: 'p1'
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        expect(data.user.repeat).to.not.exist()
        expect(data.user.password).to.not.exist()
        done(err)
      }
    )
  })


  it('user/login user test after update and change password', function(done) {
    si.act(
      { role: 'user', cmd: 'login', nick: user1Data.nick, password: 'p1' },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        expect(data.user).to.exist()
        expect(data.user.name).to.be.equal('some name')
        done(err)
      }
    )
  })

  // now update user based on orig_email and also change its password
  it('user/update test new nick and password', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'update',
        orig_email: user1Data.email,
        password: 'p2',
        repeat: 'p2'
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        done(err)
      }
    )
  })

  it('user/login user test after update and change password', function(done) {
    si.act(
      { role: 'user', cmd: 'login', nick: user1Data.nick, password: 'p2' },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        expect(data.user).to.exist()
        expect(data.user.name).to.be.equal('some name')
        done(err)
      }
    )
  })

  it('user/delete user test', function(done) {
    si.act({ role: 'user', cmd: 'delete', nick: user1Data.nick }, function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  it('user/login user test', function(done) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
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
})
