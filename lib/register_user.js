/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  const options = ctx.options
  
  return async function register_user(msg) {
    msg = intern.fix_nick_handle(msg)

    var handle = options.ensure_handle(msg, options)

    var sys_user_ent = this.entity(ctx.sys_user)
    var handle_user = await sys_user_ent.load$({handle:handle})

    if(handle_user) {
      return {
        ok: false,
        why: 'handle-exists',
        handle: handle
      }
    }

    // has precedence
    var convenience_data = {}
    ctx.convenience_fields
      .forEach(f => null == msg[f] || (convenience_data[f]=msg[f]))

    var user_data = msg.user || {}
    
    var combined_data = Object.assign(
      {
        // sane defaults
        name: handle,
      },
      user_data,
      convenience_data,
      {
        handle: handle,
        active: true
      }
    )

    var user = await this.entity(ctx.sys_user).data$(combined_data).save$()

    return { ok: true, user:user }
  }

}
