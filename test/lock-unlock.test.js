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
var wrongPassword = 'fail1fail'
var resetPassword = 'reset1reset'

var si = Seneca()
if (si.version >= '2.0.0'){
  si
    .use(require('seneca-entity'))
}
si.use('../user', {lockTry: 3})

var user1Data = {
  nick: 'nick1',
  email: 'nick1@example.com',
  password: 'test1test',
  active: true,
}

var user2Data = {
  nick: 'nick2',
  email: 'nick2@example.com',
  password: 'test2test',
  active: true,
}

suite('seneca-user update suite tests ', function () {
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

  var user2Id
  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user2Data.nick, password: user2Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      user2Id = data.user.id
      done(err)
    })
  })

  for(var i=0; i<3; i++) {
    test('user/login user test', function (done) {
      si.act({role: 'user', cmd: 'login', nick: user1Data.nick,  password: wrongPassword}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        done(err)
      })
    })

    test('user/user lock test', function (done) {
      si.act({role: 'user', cmd: 'set_user_lock', id: user2Id, failTry: true}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        done(err)
      })
    })
  }

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user2Data.nick, password: user2Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.false()
      done(err)
    })
  })

  test('user/user unlock test', function (done) {
    si.act({role: 'user', cmd: 'set_user_lock', id: user2Id}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  var resetId
  test('user/create_reset unknown user test', function (done) {
    si.act({ role: 'user', cmd: 'create_reset', nick: user1Data.nick }, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      expect(data.reset.id).to.exist()
      resetId = data.reset.token
      done(err)
    })
  })

  test('user/create_reset unknown user test', function (done) {
    si.act({ role: 'user', cmd: 'execute_reset', token: resetId, password: resetPassword, repeat: resetPassword }, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: resetPassword}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })

  test('user/login user test', function (done) {
    si.act({role: 'user', cmd: 'login', nick: user2Data.nick, password: user2Data.password}, function (err, data) {
      expect(err).to.not.exist()
      expect(data.ok).to.be.true()
      done(err)
    })
  })
})
