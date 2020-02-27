/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = ctx => {
  const intern = ctx.intern
  const options = ctx.options

  return async function register_user(msg) {
    var seneca = this

    msg = intern.fix_nick_handle(msg, options)

    var email = msg.email
    var handle = options.ensure_handle(msg, options)
    var pass = null != msg.pass ? msg.pass : msg.password
    var user_data = msg.user_data || {}

    // also checks uniqueness
    var valid_handle = await intern.valid_handle(seneca, handle, ctx)

    if (!valid_handle.ok) {
      return valid_handle
    }

    handle = valid_handle.handle

    if (null != email) {
      var email_valid = await intern.valid_email(seneca, email, ctx)
      if (!email_valid.ok) {
        return {
          ok: false,
          why: email_valid.why,
          details: {
            email: email
          }
        }
      }
    }

    var pass_fields = { fields: {} }
    if ('string' === typeof pass) {
      pass_fields = await intern.build_pass_fields(seneca, msg, ctx)
      if (!pass_fields.ok) {
        return pass_fields
      }
    }

    // has precedence
    var convenience_data = {}
    ctx.convenience_fields.forEach(
      f => null == msg[f] || (convenience_data[f] = msg[f])
    )

    var combined_data = Object.assign(
      {
        // sane defaults
        name: handle
      },
      user_data,
      convenience_data,

      // standard fields
      {
        handle: handle,
        active: true,
        verified: false,
        sv: intern.SV
      },

      pass_fields.fields
    )

    var user = await seneca
      .entity(ctx.sys_user)
      .data$(combined_data)
      .save$()

    return { ok: true, user: user }
  }
}
