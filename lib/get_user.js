/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern

  return async function get_user(msg) {
    var seneca = this

    // list verifications
    var verification = !!msg.verification

    if (verification) {
      msg = intern.load_user_fields(msg, 'verified')
    }

    var found = await intern.find_user(this, msg, ctx)

    if (!found.ok) {
      return found
    }

    if (verification) {
      found.verification = {
        items: await seneca.entity(ctx.sys_verify).list$({
          user_id: found.user.id,
        }),
      }
    }

    return found
  }
}
