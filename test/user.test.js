/* Copyright (c) 2010-2013 Richard Rodger */
"use strict";

// mocha user.test.js


var seneca = require('seneca')

var assert = require('chai').assert

var gex = require('gex')
var async = require('async')


function cberr(win) {
  return function (err) {
    if (err) {
      assert.fail(err, 'callback error')
    }
    else {
      win.apply(this, Array.prototype.slice.call(arguments, 1))
    }
  }
}


var si = seneca()
si.use('../user')

var userpin = si.pin({role: 'user', cmd: '*'})
var userent = si.make('sys', 'user')


describe('user', function () {

  it('happy', function (done) {
    async.series({
      prep: function (cb) {
        userent.load$({nick: 'nick1'}, cberr(function (user) {
          if (user) {
            user.remove$({nick: 'nick1'}, cb)
          }
          else cb();
        }))
      },

      reg1: function (cb) {
        userpin.register({
          nick: 'nick1',
          email: 'nick1@example.com',
          password: 'testtest',
          active: true
        }, cberr(cb))
      },

      login1: function (cb) {
        userpin.login({
          nick: 'nick1',
          password: 'testtest'
        }, cberr(function (out) {
          assert.ok(out.ok)
          var token = out.login.token
        }))
      }
    }, function(err, result){ done() })
  })


  it('nick-uniq', function (done) {
    userpin.register({
      nick: 'aaa',
    }, function (err, out) {
      assert.isNull(err)
      assert.ok(out.ok)

      userpin.register({
        nick: 'aaa',
      }, function (err, out) {
        assert.isNull(err)
        assert.ok(!out.ok)
        assert.equal('nick-exists', out.why)
        done()
      })
    })
  })


  it('password-mismatch', function (done) {
    userpin.register({
      nick: 'npm',
      password: 'a',
      repeat: 'b'
    }, function (err, out) {
      assert.isNull(err)
      assert.ok(!out.ok)
      assert.equal('password_mismatch', out.why)
      done()
    })
  })


  it('login-logic', function (done) {
    userpin.register({
      nick: 'n2',
      password: 'a',
      repeat: 'a'
    }, function (err, out) {
      assert.isNull(err)
      assert.ok(out.ok)

      userpin.login({nick: 'not-here'}, function (err, out) {
        assert.isNull(err)
        assert.ok(!out.ok)
        assert.equal('user-not-found', out.why)

        userpin.login({nick: 'n2', password: 'b'}, function (err, out) {
          assert.isNull(err)
          assert.ok(!out.ok)
          assert.equal('invalid-password', out.why)

          userpin.login({nick: 'n2', password: 'a'}, function (err, out) {
            assert.isNull(err)
            assert.ok(out.ok)
            assert.equal('password', out.why)
            done()
          })
        })
      })
    })
  })

  it('update', function (done) {
    userpin.register({
      nick: 'u1',
      email:'a',
      password: 'a',
      repeat: 'a'
    }, function (err, out) {
      assert.isNull(err)
      assert.ok(out.ok)

      userpin.register({
        nick: 'u2',
        email:'b',
        password: 'a',
        repeat: 'a'
      }, function (err, out) {
        assert.isNull(err)
        assert.ok(out.ok)

        userpin.update({nick: 'u1', otherProp: 'a'}, function (err, out) {
          assert.isNull(err)
          assert.ok(out.ok)
          assert.equal('a', out.user.otherProp)

          userpin.update({nick: 'u2', orig_nick: 'u1'}, function (err, out) {
            assert.isNull(err)
            assert.notOk(out.ok)

            userpin.update({email: 'b', orig_nick: 'u1'}, function (err, out) {
              assert.isNull(err)
              assert.notOk(out.ok)
              done()
            })
          })
        })
      })
    })
  })

  it('load_user', function (done) {
    userpin.register({
      nick: 'x1',
      email:'x1',
      password: 'x1',
      repeat: 'x1'
    }, function (err, out) {
      assert.isNull(err)
      assert.ok(out.ok)

      si.act({role: 'user', get: 'user', email: 'x1'}, function (err, out) {
        assert.isNull(err)
        assert.equal('x1', out.nick)
        done()
      })
    })
  })

  it('delete', function (done) {
    userpin.register({
      nick: 'd1',
      email:'d1',
      password: 'd1',
      repeat: 'd1'
    }, function (err, out) {
      assert.isNull(err)
      assert.ok(out.ok)

      userpin.login({
        nick: 'd1',
        password: 'd1'
      }, function (err, out) {
        assert.ok(out.ok)

        userpin.delete({
          nick: 'd1'
        }, function (err, out) {
          assert.isNull(err)
          assert.ok(out.ok)
          done()
        })
      })
    })
  })

  it('enable-disable-logic', function (done) {
    userpin.register({
      nick: 'en',
      password: 'a',
      repeat: 'a'
    }, function (err, out) {
      assert.isNull(err)
      assert.ok(out.ok)

      userpin.login({nick: 'en', password: 'a'}, function (err, out) {
        assert.isNull(err)
        assert.ok(out.ok)

        userpin.disable({nick: 'en'}, function (err, out) {
          assert.isNull(err)
          assert.ok(out.ok)

          userpin.login({nick: 'en', password: 'a'}, function (err, out) {
            assert.isNull(err)
            assert.notOk(out.ok)
            assert.equal('not-active', out.why)

            userpin.enable({nick: 'en'}, function (err, out) {
              assert.isNull(err)
              assert.ok(out.ok)

              userpin.login({nick: 'en', password: 'a'}, function (err, out) {
                assert.isNull(err)
                assert.ok(out.ok)

                userpin.enable({}, function (err, out) {
                  assert.isNull(err)
                  assert.notOk(out.ok)
                  assert.equal('cannot-identify-user', out.why)

                  userpin.disable({}, function (err, out) {
                    assert.isNull(err)
                    assert.notOk(out.ok)
                    assert.equal('cannot-identify-user', out.why)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  it('execute-reset', function(done) {
    userpin.register({
      nick: 'res',
      password: 'a',
      repeat: 'a'
    }, function (err, out) {
      assert.isNull(err)
      assert.ok(out.ok)

      userpin.create_reset({
        user: out.user
      }, function (err, out) {
        assert.isNull(err)
        assert.ok(out.ok)

        userpin.execute_reset({
          token: out.reset.id,
          password: 'b',
          repeat: 'b'
        }, function (err, out) {
          assert.isNull(err)
          assert.ok(out.ok)

          done()
        })
      })
    })

  });
})
