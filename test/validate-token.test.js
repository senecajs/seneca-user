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



var user1Data = {
  nick: 'nick1',
  email: 'nick1@example.com',
  password: 'test1test',
  salt: 'something',
  active: true
}

suite('seneca-user login and token validation suite tests ', function() {
  it('user/login validate token test', function(fin) {
    var si = Shared.seneca_instance({fin:fin,user:{test:true}})
    si.act(Object.assign({ role: 'user', cmd: 'register' }, user1Data), function() {
      si.act(
        {
          role: 'user',
          cmd: 'login',
          nick: user1Data.nick,
          password: user1Data.password
        },
        function(err, data) {
          if (err) return fin(err)
          si.act({ role: 'user', cmd: 'auth', token: data.login.token }, function(
            err,
            data_auth
          ) {
            expect(err).to.not.exist()
            expect(data_auth.ok).to.be.true()
            expect(data.user.nick).to.equal(data_auth.user.nick)
            fin(err)
          })
        }
      )
    })
  })

  it('user/login validate token after logout', function(fin) {
    var si = Shared.seneca_instance({fin:fin,user:{test:true}})
    si.act(Object.assign({ role: 'user', cmd: 'register' }, user1Data), function() {
      
      si.act(
        {
          role: 'user',
          cmd: 'login',
          nick: user1Data.nick,
          password: user1Data.password
        },
        function(err, data) {
          if (err) return fin(err)
          si.act(
            { role: 'user', cmd: 'logout', token: data.login.token },
            function(err, data_logout) {
              if (err) return fin(err)
              si.act(
                { role: 'user', cmd: 'auth', token: data.login.token },
                function(err, data_auth) {
                  expect(err).to.not.exist()
                  expect(data_auth.ok).to.be.false()
                  expect(data_auth.why).to.equal('login-inactive')
                  fin(err)
                }
              )
            }
          )
        }
      )
    })
  })
})
