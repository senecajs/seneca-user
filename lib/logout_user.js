/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

const Nid = require('nid')

module.exports = ctx => {
  const intern = ctx.intern
  // const options = ctx.options

  return async function logout_user(msg) {
    var seneca = this

    var token = msg.token // has precedence
    var login_id = msg.login_id
    var load_logins = !!msg.load_logins

    var found = await intern.find_user(seneca, msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    // logs out all logins by default
    var q = Object.assign(
      {},
      msg.q || {}, // custom query
      {
        user_id: user.id,
        active: true
      }
    )

    if (null != token) {
      q.token = token
    } else if (null != login_id) {
      q.id = login_id
    }

    if (!load_logins) {
      q.fields$ = []
    }

    var batch = Nid()
    var login_list = await seneca.entity(ctx.sys_login).list$(q)

    for (var i = 0; i < login_list.length; i++) {
      await login_list[i]
        .data$({
          active: false,
          logout: new Date().toISOString(),
          batch: batch
        })
        .save$()
    }

    var out = {
      ok: true,
      count: login_list.length,
      batch: batch
    }

    if (load_logins) {
      out.items = login_list
    }

    return out
  }
}
