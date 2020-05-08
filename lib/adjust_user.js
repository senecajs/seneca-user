/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern

  // Adjustments: active
  return async function adjust_user(msg) {
    var seneca = this

    var update_user = false
    var has_active = 'boolean' === typeof msg.active

    //var has_verify = 'object' === typeof msg.verify
    //var verify_out = null

    var found = await intern.find_user(seneca, msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    // idempotent
    if (has_active) {
      user.active = msg.active
      update_user = true

      if (false === user.active) {
        var res_logins = await seneca.post('sys:user,list:login', {
          user_id: user.id,
        })
        for (var i = 0; i < res_logins.items.length; i++) {
          res_logins.items[i].active = false
          res_logins.items[i].save$() // run async, no await
        }
      }
    }

    if (update_user) {
      await user.save$()
    }

    var out = { ok: true, user: user }

    return out
  }
}
