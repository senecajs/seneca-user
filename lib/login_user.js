/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern
  // const options = ctx.options
  
  return async function login_user(msg) {
    var seneca = this
    var why = null
    var valid = false
    
    // Login in automatically (without credential check)
    var auto = !!msg.auto

    // Not needed if auto
    var pass = null != msg.pass ? msg.pass : msg.password

    // Custom fields for login entity
    var login_data = msg.login_data || {}

    var user = null
    var login = null

    var find_msg = Object.assign({q:{}},msg)
    find_msg.q.fields$ = (find_msg.q.fields$ || []).concat(['pass','salt'])

    var found = await intern.find_user(seneca, find_msg, ctx)

    if(!found.ok) {
      return found
    }
    
    user = found.user

    if(!user.active) {
      return {ok:false, user_id:user.id, why:'user-not-active'}
    }

    if(auto) {
      why = 'auto'
      valid = true
    }
    else if('string' === typeof(pass)) {
      var pq = {
        proposed: pass,
        pass: user.pass,
        salt: user.salt
      }
      var res = await seneca.post('sys:user,hook:password,cmd:verify', pq)

      if(res.ok) {
        why = 'pass'
        valid = true
      }
      else {
        return {ok:false, user_id:user.id, why:'invalid-password'}
      }
    }

    if(valid) {
      login = await intern.make_login({
        why: why,
        user: user,
        seneca: seneca,
        ctx: ctx,
        login_data: login_data
      })
    }


    // TODO: remove pass and salt from output
    
    var out = {ok:!!login, user:valid?user:null, login, why:why||'no-login-method'}
    return out
  }

}
