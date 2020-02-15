/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  
  // Adjustments: active
  return async function adjust_user(msg) {
    var seneca = this

    var update_user = false
    var has_active = 'boolean' === typeof(msg.active)
    
    var found = await intern.find_user(seneca, msg, ctx)

    if(!found.ok) {
      return found
    }
    
    var user = found.user

    // idempotent
    if(has_active) {
      user.active = msg.active
      update_user = true
    }

    if(update_user) {
      await user.save$()
    }

    return {ok:true, user:user}
  }

}
