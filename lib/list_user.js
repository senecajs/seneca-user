/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  // const options = ctx.options

  return async function list_user(msg) {
    var seneca = this

    var active = msg.active
    var q = msg.q || {}

    if (null != active) {
      q.active = !!active
    }

    msg = intern.load_user_fields(
      msg,
      ctx.standard_user_fields.concat(Object.keys(q))
    )

    var full_query = q
    var items = await seneca.entity('sys/user').list$(full_query)

    return { ok: true, items: items }
  }
}
