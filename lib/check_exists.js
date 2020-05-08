/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern

  return async function check_exists(msg) {
    var seneca = this

    msg.fields = []
    var found = await intern.find_user(seneca, msg, ctx)

    return found
  }
}
