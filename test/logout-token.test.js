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

var si = Seneca()
if (si.version >= '2.0.0'){
    si
        .use(require('seneca-entity'))
}
si
    .use('../user')

var user1Data = {
    nick: 'nick1',
    email: 'nick1@example.com',
    password: 'test1test',
    repeat: 'test1test',
    active: true
}

suite('seneca-user auth-logout-token suite tests ', function () {
    before({}, function (done) {
        si.ready(function (err) {
            if (err) {
                return process.exit(!console.error(err))
            }

            done()
        })
    })

    test('user/auth should fail on expired token', function (done) {
        var token;

        si.act(_.extend({role: 'user', cmd: 'register'}, user1Data), function (err, data) {
            expect(err).to.not.exist()
            expect(data.user.repeat).to.not.exist()
            expect(user1Data.nick, data.nick).to.exist()

            si.act({role: 'user', cmd: 'login', nick: user1Data.nick, password: user1Data.password}, function (err, data) {
                expect(err).to.not.exist()
                expect(data.ok).to.exist()
                expect(data.why).to.equal('password')
                expect(data.login).to.exist()
                expect(data.user).to.exist()
                expect(data.login.repeat).to.not.exist()
                expect(data.user.repeat).to.not.exist()
                expect(data.login.token).to.exist()

                token = data.login.token;

                si.act({role: 'user', cmd: 'logout', token: token}, function (err, data) {
                    expect(err).to.not.exist()
                    expect(data.ok).to.exist()
                    expect(data.login.active).to.equal(false)
                    expect(data.login.ended).to.exist()

                    si.act({role: 'user', cmd: 'auth', token: token}, function (err, data) {
                        expect(err).to.not.exist()
                        expect(data.ok).to.equal(false)
                        expect(data.token).to.exist()
                        expect(data.why).to.equal('token-expired')
                        done()
                    })
                })
            })
        })
    })

})
