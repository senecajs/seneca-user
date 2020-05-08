/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

// NOTE: remove:false => retain records but anonymize

module.exports = (ctx) => {
  const intern = ctx.intern
  // const options = ctx.options

  return async function remove_user(msg) {
    var seneca = this

    // just anonymize default
    var purge = null == msg.purge ? false : !!msg.purge

    var anon_fields = msg.anon_fields || []

    var anon = intern.make_handle()

    var found = await intern.find_user(seneca, msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    var removed = new Date().toISOString()

    // update all logins
    var login_list = await seneca.entity(ctx.sys_login).list$({
      user_id: user.id,
    })

    for (var i = 0; i < login_list.length; i++) {
      if (purge) {
        // Run async - don't wait
        login_list[i].remove$()
      } else {
        var logout_data = {
          handle: anon,
          active: false,
          archived: true,
          removed: removed,
        }

        if (login_list[i].active) {
          logout_data.logout = new Date().toISOString()
        }

        // Run async - don't wait
        login_list[i].data$(logout_data).save$()
      }
    }

    if (purge) {
      await user.remove$()
    } else {
      user.name = anon
      user.handle = anon
      user.email = anon + '@example.com'
      user.removed = removed
      user.active = false
      user.archived = true

      anon_fields.forEach((f) => (user[f] = anon))

      await user.save$()
    }

    var out = {
      ok: true,
      login_count: login_list.length,
      removed: removed,
      purged: purge,
      user_id: user.id,
    }

    return out
  }
}
