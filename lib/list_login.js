/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  const options = ctx.options

  return async function list_login(msg) {
    var seneca = this

    var active = msg.active
    var login_q = msg.login_q
    var found = await intern.find_user(seneca, msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    var full_login_q = Object.assign(
      {
        user_id: user.id,
        // list only active logins by default
        active: 'boolean' === typeof active ? active : true,
        sort$: { when: -1 },
        limit$: options.limit,
      },
      login_q || {}
    )

    var items = await seneca.entity(ctx.sys_login).list$(full_login_q)

    return { ok: true, items: items }
  }
}
