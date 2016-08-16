'use strict'

var Seneca = require('seneca')
var Async = require('async')

var Lab = require('lab')
var Code = require('code')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before
var beforeEach = lab.beforeEach
var expect = Code.expect
var wrongPassword = 'fail1fail'
var resetPassword = 'reset1reset'
var failedCount = 3

var si = Seneca()
var siDefault = Seneca({
  log: 'silent'
})

if (si.version >= '2.0.0') {
  si.use(require('seneca-entity'))
  siDefault.use(require('seneca-entity'))
}

var user_canon = 'sys/user'
var user1Data = {
  nick: 'nick1',
  email: 'nick1@example.com',
  password: 'test1test',
  active: true,
  id: ''
}

function initData (si) {
  return function init (done) {
    si.make(user_canon).remove$({ all$: true }, function (err) {
      expect(err).to.not.exist()

      si.act({role: 'user', cmd: 'register'}, user1Data, function (err, data) {
        expect(err).to.not.exist()
        expect(data.user.nick).to.equal(user1Data.nick)
        user1Data.id = data.user.id

        siDefault.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
          expect(err).to.not.exist()
          expect(data.ok).to.be.true()

          done()
        })
      })
    })
  }
}

siDefault.use(require('../user'))
suite('seneca-user default lock tests ', function () {
  beforeEach(initData(siDefault))

  before({}, function (done) {
    siDefault.ready(function (err) {
      if (err) return process.exit(!console.error(err))
      done()
    })
  })

  test('No lock by default', function (done) {
    Async.timesSeries(failedCount + 5, function (n, next) {
      siDefault.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: wrongPassword}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        expect(data.why).to.equal('invalid-password')

        next()
      })
    }, function (err, results) {
      expect(err).to.not.exist()
      done()
    })
  })
})

si.use('../user', { failedLoginCount: failedCount })
suite('seneca-user lock tests ', function () {
  beforeEach(initData(si))

  before({}, function (done) {
    si.ready(function (err) {
      if (err) return process.exit(!console.error(err))
      done()
    })
  })

  test('Lock after failedLoginCount attempts', function (done) {
    Async.timesSeries(failedCount + 1, function (n, next) {
      si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: wrongPassword}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        var reason = (n < failedCount) ? 'invalid-password' : 'locked-out'
        expect(data.why).to.equal(reason)

        next()
      })
    }, function (err, results) {
      expect(err).to.not.exist()

      si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.equal(false)
        expect(data.why).to.equal('locked-out')

        done()
      })
    })
  })

  test('Password reset resets failed logins counter', function (done) {
    Async.timesSeries(failedCount + 2, function (n, next) {
      if (n === (failedCount - 1)) {
        si.act({ role: 'user', cmd: 'create_reset', nick: user1Data.nick }, function (err, data) {
          expect(err).to.not.exist()
          expect(data.ok).to.be.true()
          expect(data.reset.id).to.exist()
          var resetId = data.reset.token

          si.act({ role: 'user', cmd: 'execute_reset', token: resetId, password: resetPassword, repeat: resetPassword }, function (err, data) {
            expect(err).to.not.exist()
            expect(data.ok).to.be.true()
            next()
          })
        })
      }
      else {
        si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: wrongPassword}, function (err, data) {
          expect(err).to.not.exist()
          expect(data.ok).to.equal(false)
          expect(data.why).to.equal('invalid-password')

          next()
        })
      }
    }, function (err, results) {
      expect(err).to.not.exist()

      done()
    })
  })

  test('Successfull login resets failed logins counter', function (done) {
    Async.timesSeries(failedCount + 2, function (n, next) {
      var loginSucceeds = (n === (failedCount - 1))
      var pass = loginSucceeds ? user1Data.password : wrongPassword

      si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: pass}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.equal(loginSucceeds)
        expect(data.why).to.not.equal('locked-out')

        next()
      })
    }, function (err, results) {
      expect(err).to.not.exist()

      done()
    })
  })

  test('Unlock after lock', function (done) {
    Async.timesSeries(failedCount + 1, function (n, next) {
      si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: wrongPassword}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.false()
        var reason = (n < failedCount) ? 'invalid-password' : 'locked-out'
        expect(data.why).to.equal(reason)

        next()
      })
    }, function (err, results) {
      expect(err).to.not.exist()
      si.act({role: 'user', cmd: 'unlock', id: user1Data.id}, function (err, data) {
        expect(err).to.not.exist()
        expect(data.ok).to.be.true()

        si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
          expect(err).to.not.exist()
          expect(data.ok).to.be.true()

          done()
        })
      })
    })
  })
})
