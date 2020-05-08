/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  // const options = ctx.options

  return async function make_verify(msg) {
    var seneca = this

    var anon = !!msg.anon

    var user = null
    if (!anon) {
      var found = await intern.find_user(this, msg, ctx)

      if (!found.ok) {
        return found
      } else {
        user = found.user
      }
    }

    var kind = msg.kind
    var code = msg.code || intern.make_token()
    var once = null == msg.once ? true : !!msg.once
    var valid = null == msg.valid ? false : !!msg.valid
    var unique = null == msg.unique ? true : !!msg.unique

    var custom = msg.custom || {}

    // convenience field for `kind`
    if (null != msg[kind]) {
      custom[kind] = msg[kind]
    }

    var now_date = new Date()
    var t_c = now_date.getTime()
    var t_c_s = now_date.toISOString()
    var t_m = t_c
    var t_m_s = t_c_s

    var t_expiry =
      null != msg.expire_point
        ? msg.expire_point
        : null != msg.expire_duration
        ? t_c + msg.expire_duration
        : Number.MAX_SAFE_INTEGER

    var verify_data = {
      ...custom,
      kind: kind,
      code: code,
      once: once,
      used: false,
      valid: valid,
      t_expiry: t_expiry,
      t_c: t_c,
      t_c_s: t_c_s,
      t_m: t_m,
      t_m_s: t_m_s,
      sv: intern.SV,
    }

    if (user) {
      verify_data.user_id = user.id
    }

    if (unique) {
      var unique_query = {
        kind: kind,
      }

      if (user) {
        unique_query.user_id = user.id
      }

      if (null == custom[kind]) {
        unique_query.code = code
      } else {
        unique_query[kind] = custom[kind]
      }

      var existing_verify = await seneca
        .entity(ctx.sys_verify)
        .load$(unique_query)

      if (existing_verify) {
        return {
          ok: false,
          why: 'not-unique',
          details: {
            query: unique_query,
          },
        }
      }
    }

    var verify = await seneca.entity(ctx.sys_verify).data$(verify_data).save$()

    return { ok: true, verify: verify }
  }
}
