/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

const Nid = require('nid')

var generate_password = Nid({
  length: 12,
  alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
})

// TODO: validate pass minlen

module.exports = (ctx) => {
  const intern = ctx.intern

  return async function change_pass(msg) {
    var seneca = this

    var verify = msg.verify // optional verification code

    var pass_msg = Object.assign({}, msg)
    if (msg.generate) {
      pass_msg.pass = generate_password()
      delete pass_msg.password // remove ambiguity
    }

    var user_data = intern.normalize_user_data(pass_msg, ctx)
    var pass_fields = await intern.build_pass_fields(seneca, user_data, ctx)
    if (!pass_fields.ok) {
      return pass_fields
    }

    var found = await intern.find_user(seneca, msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    // Password is being changed using a verification code
    if (verify) {
      var verify_msg = {
        user_id: user.id,
        kind: 'pass',
        code: verify,
      }

      // TODO: implement and rename pwd verify
      var verification = await seneca.post('sys:user,check:verify', verify_msg)

      if (!verification.ok) {
        return verification
      }
    }

    user = await user.data$(pass_fields.fields).save$()

    var out = { ok: true, user: user }

    if (msg.generate) {
      out.pass = pass_msg.pass
    }

    return out
  }
}
