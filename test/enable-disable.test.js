/* Copyright (c) 2010-2019 Richard Rodger */
'use strict'

// TODO: replace with seneca-msg-test spec

var Seneca = require('seneca')
const Shared = require('./shared')

const Code = require('@hapi/code')
const Lab = require('@hapi/lab')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var suite = lab.suite
var expect = Code.expect
var it = Shared.make_it(lab)

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

var si = Shared.seneca_instance({ user: { test: true } })

suite('seneca-user activate/deactivate suite tests ', function() {
  it('user/register test', function(fin) {
    si.act(
      Object.assign({ role: 'user', cmd: 'register' }, user1Data),
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.user.nick).to.equal(user1Data.nick)
        fin(err)
      }
    )
  })

  it('user/register test', function(fin) {
    si.act(
      Object.assign({ role: 'user', cmd: 'register' }, user2Data),
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.user.nick).to.equal(user2Data.nick)
        fin(err)
      }
    )
  })

  it('user/login user test mark-0', function(fin) {
    // var si = seneca_instance().test(fin)
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
        password: user1Data.password
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        fin(err)
      }
    )
  })

  it('user/disable user test', function(fin) {
    si.act({ role: 'user', cmd: 'deactivate', nick: user1Data.nick }, function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      fin(err)
    })
  })

  it('user/login user test', function(fin) {
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
        expect(data.why).to.equal('not-active')
        fin(err)
      }
    )
  })

  it('user/enable user test', function(fin) {
    si.act({ role: 'user', cmd: 'activate', nick: user1Data.nick }, function(
      err,
      data
    ) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      fin(err)
    })
  })

  it('user/verify password user test', function(fin) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
        password: user1Data.password
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        expect(data.user).to.be.exist()
        expect(data.user.pass).to.exist()
        si.act(
          {
            role: 'user',
            cmd: 'verify_password',
            proposed: user1Data.password,
            salt: user1Data.salt,
            pass: data.user.pass
          },
          function(err, data) {
            expect(err).to.not.exist()
            expect(data.ok).to.be.true()
            fin(err)
          }
        )
      }
    )
  })

  it('user/incorrect verify password user test', function(fin) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
        password: user1Data.password
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        expect(data.user).to.exist()
        expect(data.user.pass).to.exist()
        si.act(
          {
            role: 'user',
            cmd: 'verify_password',
            proposed: user1Data.password + '1',
            salt: user1Data.salt,
            pass: data.user.pass
          },
          function(err, data) {
            expect(err).to.not.exist()
            expect(data.ok).to.be.false()
            fin(err)
          }
        )
      }
    )
  })

  it('user/login user test', function(fin) {
    si.act(
      {
        role: 'user',
        cmd: 'login',
        nick: user1Data.nick,
        password: user1Data.password
      },
      function(err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()
        fin(err)
      }
    )
  })

  it('user/disable unknown user test', function(fin) {
    si.act({ role: 'user', cmd: 'deactivate' }, function(err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      expect(data.why).to.equal('cannot-identify-user')
      fin(err)
    })
  })

  it('user/enable unknown user test', function(fin) {
    si.act({ role: 'user', cmd: 'activate' }, function(err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      expect(data.why).to.equal('cannot-identify-user')
      fin(err)
    })
  })
})
