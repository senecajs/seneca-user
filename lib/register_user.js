/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'


// TODO: handle min length, as per password

module.exports = (ctx) => {
  const intern = ctx.intern
  const options = ctx.options
  
  return async function register_user(msg) {
    var seneca = this
    msg = intern.fix_nick_handle(msg)

    var handle = options.ensure_handle(msg, options)
    var pass = null != msg.pass ? msg.pass : msg.password
    var user_data = msg.user_data || {}

    if(handle.length < options.handle.minlen) {
      return {
        ok: false,
        why: 'handle-too-short',
        handle: handle,
        details: {
          handle_length: handle.length,
          minimum: options.handle.minlen
        }
      }
    }
    
    var sys_user_ent = seneca.entity(ctx.sys_user)
    var handle_user = await sys_user_ent.load$({handle:handle})

    if(handle_user) {
      return {
        ok: false,
        why: 'handle-exists',
        handle: handle
      }
    }


    var pass_fields = {fields:{}}
    if('string' === typeof(pass)) {
      pass_fields = await intern.build_pass_fields(seneca,msg,ctx)
      if(!pass_fields.ok) {
        return pass_fields
      }
    }

    
    // has precedence
    var convenience_data = {}
    ctx.convenience_fields
      .forEach(f => null == msg[f] || (convenience_data[f]=msg[f]))

    
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
      },
      pass_fields.fields
    )

    var user = await seneca.entity(ctx.sys_user).data$(combined_data).save$()
    
    return { ok: true, user:user }
  }

}
