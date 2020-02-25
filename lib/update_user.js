/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = ctx => {
  const intern = ctx.intern
  //const options = ctx.options

  return async function update_user(msg) {
    var seneca = this

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

    var pass_data = intern.extract_pass(msg)

    // in order of precedence
    var user_data = Object.assign(
      {},
      msg.user || {},
      msg.user_data || {},
      pass_data
    )

    // handle, email, password are handled separately by specialist actions

    if (null != user_data.handle) {
      var handle_change = await seneca.post('sys:user,change:handle', {
        user_id: user.id,
        new_handle: user_data.handle
      })
      if (!handle_change.ok) {
        return handle_change
      }
      delete user_data.handle
    }

    if (null != user_data.email) {
      var email_change = await seneca.post('sys:user,change:email', {
        user_id: user.id,
        new_email: user_data.email
      })
      if (!email_change.ok) {
        return email_change
      }
      delete user_data.email
    }

    if (null != pass_data.pass) {
      var pass_change = await seneca.post('sys:user,change:pass', {
        user_id: user.id,
        pass: pass_data.pass,
        repeat: pass_data.repeat
      })
      if (!pass_change.ok) {
        return pass_change
      }
    }

    user_data.id = user.id
    user = await seneca
      .entity(ctx.sys_user)
      .data$(user_data)
      .save$()

    return { ok: true, user: user }
  }
}
