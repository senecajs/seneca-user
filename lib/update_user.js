/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  //const options = ctx.options

  return async function update_user(msg) {
    var seneca = this

    // NOTE: contents of `user` or `user_data` are used for update, not query
    var find_msg = Object.assign({}, msg)
    delete find_msg.user
    delete find_msg.user_data

    var found = await intern.find_user(seneca, find_msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    // NOTE: handle, email, pass must be in msg.user or msg.user_data to update
    // top level is used to find user

    // strip top level convenience_fields
    var data_msg = Object.assign(
      {},
      msg,
      ctx.convenience_fields.reduce((m, f) => ((m[f] = void 0), m), {})
    )

    var user_data = intern.normalize_user_data(data_msg, ctx)

    // handle, email, password are handled separately by specialist actions

    if (null != user_data.handle) {
      var handle_change = await seneca.post('sys:user,change:handle', {
        user_id: user.id,
        new_handle: user_data.handle,
      })
      if (!handle_change.ok) {
        return handle_change
      }

      // don't update again
      delete user_data.handle
    }

    if (null != user_data.email) {
      var email_change = await seneca.post('sys:user,change:email', {
        user_id: user.id,
        new_email: user_data.email,
      })
      if (!email_change.ok) {
        return email_change
      }

      // don't update again
      delete user_data.email
    }

    if (null != user_data.pass) {
      var pass_change = await seneca.post('sys:user,change:pass', {
        user_id: user.id,
        pass: user_data.pass,
        repeat: user_data.repeat,
      })
      if (!pass_change.ok) {
        return pass_change
      }

      // don't corrupt
      delete user_data.pass
      delete user_data.repeat
    }

    user_data.id = user.id
    user = await seneca.entity(ctx.sys_user).data$(user_data).save$()

    return { ok: true, user: user }
  }
}
