/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  const options = ctx.options

  return async function register_user(msg) {
    var seneca = this

    var user_data = intern.normalize_user_data(msg, ctx)

    // console.log('REG NORM', msg, user_data)

    var email = user_data.email
    var handle = options.ensure_handle(user_data, options)
    var pass = user_data.pass

    // also checks uniqueness
    var valid_handle = await intern.valid_handle(seneca, handle, ctx)

    if (!valid_handle.ok) {
      return valid_handle
    }

    user_data.handle = handle = valid_handle.handle

    if (null != email) {
      var email_valid = await intern.valid_email(seneca, email, ctx)
      if (!email_valid.ok) {
        return {
          ok: false,
          why: email_valid.why,
          details: {
            email: email,
          },
        }
      }
    }

    var pass_fields = { fields: {} }
    if ('string' === typeof pass) {
      pass_fields = await intern.build_pass_fields(seneca, user_data, ctx)
      if (!pass_fields.ok) {
        return pass_fields
      }
    }

    var combined_data = Object.assign(
      {
        // sane defaults
        name: handle,
      },
      user_data,

      // standard fields
      {
        handle: handle,
        active: true,
        verified: false,
        sv: intern.SV,
      },

      pass_fields.fields
    )

    var user = await seneca.entity(ctx.sys_user).data$(combined_data).save$()

    return { ok: true, user: user }
  }
}
