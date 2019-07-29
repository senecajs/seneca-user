/* Copyright (c) 2010-2019 Richard Rodger and other contributors, MIT License. */
'use strict'

var Seneca = require('seneca')
var Async = require('async')
const Shared = require('./shared')

const Code = require('@hapi/code')
const Lab = require('@hapi/lab')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var suite = lab.suite
var expect = Code.expect
var it = Shared.make_it(lab)


var wrongPassword = 'fail1fail'
var resetPassword = 'reset1reset'
var failedCount = 3


var user_canon = 'sys/user'
var user1Data = {
  nick: 'nick1',
  email: 'nick1@example.com',
  password: 'test1test',
  active: true,
  id: ''
}


var si = Shared.seneca_instance({user: { failedLoginCount: failedCount }})


async function init() {
  return new Promise((resolve)=>{
    si.make(user_canon).remove$({ all$: true }, function(err) {
      expect(err).to.not.exist()
      
      si.act({ role: 'user', cmd: 'register' }, user1Data, function(err, data) {
        expect(err).to.not.exist()
        expect(data.user.nick).to.equal(user1Data.nick)
        user1Data.id = data.user.id
        
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

            resolve()
          }
        )
      })
    })
  })
}

suite('seneca-user default lock tests ', function() {
  lab.beforeEach(init)
  
  it('No lock by default', function(done) {
    var si = Shared.seneca_instance()
    
    si.act({ role: 'user', cmd: 'register' }, user1Data, function(err, data) {
      expect(err).to.not.exist()

      Async.timesSeries(
        failedCount + 5,
        function(n, next) {

          si.act(
            {
              role: 'user',
              cmd: 'login',
              nick: data.user.nick,
              password: wrongPassword
            },
            function(err, data) {
              expect(err).to.not.exist()
              expect(data.ok).to.be.false()
              expect(data.why).to.equal('invalid-password')
              
              next()
            }
          )
        },
        function(err, results) {
          expect(err).to.not.exist()
          done()
        }
      )
    })
  })
})


suite('seneca-user lock tests ', function() {
  lab.beforeEach(init)


  it('Lock after failedLoginCount attempts', function(done) {
    Async.timesSeries(
      failedCount + 1,
      function(n, next) {
        si.act(
          {
            role: 'user',
            cmd: 'login',
            nick: user1Data.nick,
            password: wrongPassword
          },
          function(err, data) {
            expect(err).to.not.exist()
            expect(data.ok).to.be.false()
            var reason = n < failedCount ? 'invalid-password' : 'locked-out'
            expect(data.why).to.equal(reason)

            next()
          }
        )
      },
      function(err, results) {
        expect(err).to.not.exist()

        si.act(
          {
            role: 'user',
            cmd: 'login',
            nick: user1Data.nick,
            password: user1Data.password
          },
          function(err, data) {
            expect(err).to.not.exist()
            expect(data.ok).to.equal(false)
            expect(data.why).to.equal('locked-out')

            done()
          }
        )
      }
    )
  })

  it('Password reset resets failed logins counter', function(done) {
    Async.timesSeries(
      failedCount + 2,
      function(n, next) {
        if (n === failedCount - 1) {
          si.act(
            { role: 'user', cmd: 'create_reset', nick: user1Data.nick },
            function(err, data) {
              expect(err).to.not.exist()
              expect(data.ok).to.be.true()
              expect(data.reset.id).to.exist()
              var resetId = data.reset.token

              si.act(
                {
                  role: 'user',
                  cmd: 'execute_reset',
                  token: resetId,
                  password: resetPassword,
                  repeat: resetPassword
                },
                function(err, data) {
                  expect(err).to.not.exist()
                  expect(data.ok).to.be.true()
                  next()
                }
              )
            }
          )
        } else {
          si.act(
            {
              role: 'user',
              cmd: 'login',
              nick: user1Data.nick,
              password: wrongPassword
            },
            function(err, data) {
              expect(err).to.not.exist()
              expect(data.ok).to.equal(false)
              expect(data.why).to.equal('invalid-password')

              next()
            }
          )
        }
      },
      function(err, results) {
        expect(err).to.not.exist()

        done()
      }
    )
  })

  it('Successfull login resets failed logins counter', function(done) {
    Async.timesSeries(
      failedCount + 2,
      function(n, next) {
        var loginSucceeds = n === failedCount - 1
        var pass = loginSucceeds ? user1Data.password : wrongPassword

        si.act(
          { role: 'user', cmd: 'login', nick: user1Data.nick, password: pass },
          function(err, data) {
            expect(err).to.not.exist()
            expect(data.ok).to.equal(loginSucceeds)
            expect(data.why).to.not.equal('locked-out')

            next()
          }
        )
      },
      function(err, results) {
        expect(err).to.not.exist()

        done()
      }
    )
  })

  it('Unlock after lock', function(done) {
    Async.timesSeries(
      failedCount + 1,
      function(n, next) {
        si.act(
          {
            role: 'user',
            cmd: 'login',
            nick: user1Data.nick,
            password: wrongPassword
          },
          function(err, data) {
            expect(err).to.not.exist()
            expect(data.ok).to.be.false()
            var reason = n < failedCount ? 'invalid-password' : 'locked-out'
            expect(data.why).to.equal(reason)

            next()
          }
        )
      },
      function(err, results) {
        expect(err).to.not.exist()
        si.act({ role: 'user', cmd: 'unlock', id: user1Data.id }, function(
          err,
          data
        ) {
          expect(err).to.not.exist()
          expect(data.ok).to.be.true()

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

              done()
            }
          )
        })
      }
    )
  })
})
