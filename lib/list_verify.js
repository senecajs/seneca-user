/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  // const options = ctx.options

  return async function make_verify(msg) {
    var seneca = this

    // q is for sys/verify
    msg.user_q = msg.user_q || {}
    var found = await intern.find_user(this, msg, ctx)

    if (!found.ok) {
      return found
    }

    var q = {
      user_id: found.user.id,
    }

    if (null != msg.kind) {
      q.kind = msg.kind

      if (null != msg[msg.kind]) {
        q[msg.kind] = msg[msg.kind]
      }
    }

    var convenience = ['code', 'once', 'valid', 'unique']
    convenience.forEach((f) => {
      if (null != msg[f]) {
        q[f] = msg[f]
      }
    })

    q = {
      ...(msg.q || {}),
      ...q,
    }

    var items = await seneca.entity(ctx.sys_verify).list$(q)

    return { ok: true, items: items, q: q }
  }
}
