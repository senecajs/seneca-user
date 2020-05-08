/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

// NOTE: assumes DB has a unique index on sys/user.handle

// TODO: list of disallowed handles

module.exports = (ctx) => {
  const intern = ctx.intern
  // const options = ctx.options

  return async function change_handle(msg) {
    var seneca = this

    var new_handle = msg.new_handle

    var found = await intern.find_user(seneca, msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    // idempotent - only change if needed
    if (user.handle != new_handle) {
      var valid_handle = await intern.valid_handle(seneca, new_handle, ctx)

      if (!valid_handle.ok) {
        valid_handle.details.user_id = user.id
        valid_handle.details.user_handle = user.handle
        return valid_handle
      }

      new_handle = valid_handle.handle

      user = await user.data$({ handle: new_handle }).save$()
    }

    var out = { ok: true, user: user }

    return out
  }
}
