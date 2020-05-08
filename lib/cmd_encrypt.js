/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

const Hasher = require('./hasher.js')

module.exports = (ctx) => {
  // const intern = ctx.intern
  const options = ctx.options

  return async function cmd_encrypt(msg) {
    var seneca = this
    var salt = msg.salt || options.generate_salt(options)
    var pass = null != msg.password ? msg.password : msg.pass
    var pepper = options.pepper
    var rounds = null == msg.rounds ? options.rounds : msg.rounds
    var fail = true === msg.fail ? true : false

    if (null == pass) {
      return seneca.fail('no_pass')
    }

    if (pass.length < options.password.minlen) {
      return {
        ok: false,
        why: 'password-too-short',
        details: {
          password_length: pass.length,
          minimum: options.password.minlen,
        },
      }
    }

    // console.log('ENCRYPT', msg.whence, rounds)

    // TODO: use a queue to rate limit
    return new Promise((resolve, reject) => {
      Hasher(
        seneca,
        {
          fail: fail,
          test: options.test,
          src: pepper + pass + salt,
          rounds: rounds,
        },
        function (err, out) {
          // console.log('EEE',pass,err,out)
          if (err) {
            return reject(err)
          } else {
            return resolve({ ok: !err, pass: out.hash, salt: salt })
          }
        }
      )
    })
  }
}
