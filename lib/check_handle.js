/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  // const options = ctx.options

  return async function check_handle(msg) {
    var seneca = this

    var handle = msg.handle
    var out = await intern.valid_handle(seneca, handle, ctx)

    if (!out.ok) {
      out.handle = out.details.handle
    }

    return out
  }
}
