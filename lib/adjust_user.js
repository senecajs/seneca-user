/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = ctx => {
  const intern = ctx.intern

  // Adjustments: active
  return async function adjust_user(msg) {
    var seneca = this

    var update_user = false
    var has_active = 'boolean' === typeof msg.active

    var has_verify = 'object' === typeof msg.verify
    var verify_out = null
    
    var found = await intern.find_user(seneca, msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    // idempotent
    if (has_active) {
      user.active = msg.active
      update_user = true

      if (false === user.active) {
        var res_logins = await seneca.post('sys:user,list:login', {
          user_id: user.id
        })
        for (var i = 0; i < res_logins.items.length; i++) {
          res_logins.items[i].active = false
          res_logins.items[i].save$() // run async, no await
        }
      }
    }

    // add or update verification entries
    // NOTE: best practice is { kind: 'code', code: '...' } if using multiple codes
    // as ensures new entry for each code
    // (otherwise you have to use q:{} (see adjust unit test - MARK001))
    if(has_verify) {
      var verify = msg.verify
      
      // `kind` is 'direct' unless specified
      verify.kind = 'string' == typeof(verify.kind) ? verify.kind : 'direct'

      if(['kind','valid','since','when'].includes(verify.kind)) {
        return seneca.fail('bad_verify_kind', {verify})
      }
      
      // false unless specified
      verify.valid = null == verify.valid ? false : !!verify.valid

      // set when (update date+time) - always modify
      verify.when = new Date().toISOString()

      // TODO: support convenience: kind name can be top level prop for query
      // (error if === kind,valid,since,when of course)
      // lookup existing verify
      var vq = Object.assign({
        kind: verify.kind,
        user_id: user.id
      }, verify.q||{})

      // query convenience prop
      // NOTE != does not work on `undefined`!!!
      if(!(null==verify[verify.kind])){
        vq[verify.kind] = verify[verify.kind]
      }

      var found_verify = await seneca.entity(ctx.sys_verify).list$(vq)
      if(1 < found_verify.length) {
        return {ok:false, why:'verify-not-unique',details:{verify:verify,query:vq}}
      }

      var existing_verify_data =
          found_verify[0] ? found_verify[0].data$(false) : {} 

      var full_verify_data = Object.assign(
        {},
        existing_verify_data,
        verify,
        { user_id: user.id }
      )
      
      delete full_verify_data.q // just used for query of custom fields
      
      // set since (creation date+time) if not set
      full_verify_data.since = null == full_verify_data.since ? new Date().toISOString() : ''+full_verify_data.since

      // create or update
      await seneca
        .entity(ctx.sys_verify)
        .data$(full_verify_data)
        .save$()

      verify_out = await seneca.entity(ctx.sys_verify).list$({
        user_id: found.user.id
      })

      // true if any are true
      user.verified =
        verify_out.reduce((verified,verify)=>verified||verify.valid, false)

      update_user = true
    }
    
    if (update_user) {
      await user.save$()
    }

    var out = { ok: true, user: user }

    if(verify_out) {
      out.verify = verify_out
    }

    return out
  }
}
