/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  // const options = ctx.options

  // use anon:true if user now known
  return async function check_verify(msg) {
    var seneca = this

    var anon = msg.anon
    var kind = msg.kind
    var code = msg.code
    var now = msg.now || Date.now()
    var expiry = !!msg.expiry

    var user = null

    if (!anon) {
      // q is for sys/verify
      msg.user_q = msg.user_q || {}
      var found = await intern.find_user(this, msg, ctx)

      if (!found.ok) {
        return found
      } else {
        user = found.user
      }
    }

    var q = {}

    if (user) {
      q.user_id = user.id
    }

    if (null != kind) {
      q.kind = kind
    }

    if (null != msg[kind]) {
      q[kind] = msg[kind]
    }

    if (null != code) {
      q.code = code
    }

    q = {
      ...(msg.q || {}),
      ...q,
    }

    var verify = await seneca.entity(ctx.sys_verify).load$(q)

    var out = { ok: false }

    if (null == verify) {
      out.why = 'no-verify'
      out.details = { q: q }
    } else if (expiry && verify.t_expiry < now) {
      out.why = 'verify-expired'
      out.details = { now: now, expiry: verify.t_expiry }
    } else if (verify.once && verify.used) {
      out.why = 'verify-already-used'
      out.details = { q: q, verify: verify }
    } else {
      out.ok = verify.valid
    }

    if (verify && verify.once && !verify.used) {
      verify.used = true
      await verify.save$()
    }

    if (!out.ok && null == out.why) {
      out.why = 'verify-not-valid'
    }

    if (out.ok) {
      out.verify = verify
    }

    return out
  }
}
