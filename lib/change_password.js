/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

const Nid = require('nid')

var generate_password = Nid({
  length: 12,
  alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
})

module.exports = ctx => {
  const intern = ctx.intern

  return async function change_password(msg) {
    var seneca = this

    var verify = msg.verify // optional verification code
    
    var pass_msg = Object.assign({},msg)
    if(msg.generate) {
      pass_msg.pass = generate_password()
      delete pass_msg.password // remove ambiguity
    }
    
    var pass_fields = await intern.build_pass_fields(seneca, pass_msg, ctx)
    if (!pass_fields.ok) {
      return pass_fields
    }
    
    var found = await intern.find_user(this, msg, ctx)

    if(!found.ok) {
      return found
    }

    // Password is being changed using a verification code
    if(verify) {
      var verify_query = {
        user_id: user.id,
        kind: 'pass',
        code: verify,
        once: true // one time use
      }

      // TODO: implement and rename pwd verify
      var verification = await seneca.post('sys:user,cmd:verify',verify_query)

      if(!verification.ok) {
        return verification
      }
    }

    var user = await user.data$(pass_fields).save$()
    
    var out = {ok:true, user:user}

    if(msg.generate) {
      out.pass = pass_msg.pass
    }

    return out
  }
}
