/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  // const intern = ctx.intern
  // const options = ctx.options

  return async function cmd_pass(msg) {
    var seneca = this

    var proposed = msg.proposed // proposed plain text
    var pass = msg.pass // password hash
    var salt = msg.salt

    var res = await seneca.post('sys:user,hook:password,cmd:encrypt', {
      pass: proposed,
      salt: salt,
      whence: 'cmd_pass',
    })

    var ok = res.ok && res.pass === pass

    return ok
      ? { ok: true }
      : {
          ok: false,
          why: res.ok ? 'no-match' : res.why,
          details: res.details || {},
        }
  }
}
