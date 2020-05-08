/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern

  return async function change_email(msg) {
    var seneca = this

    var new_email = msg.new_email
    var verify = msg.verify // optional verification code

    var found = await intern.find_user(seneca, msg, ctx)

    if (!found.ok) {
      return found
    }

    var user = found.user

    // Email is being changed using a verification code
    if (verify) {
      var verify_msg = {
        user_id: user.id,
        kind: 'email',
        code: verify,
      }

      // TODO: implement and rename pwd verify
      var verification = await seneca.post('sys:user,check:verify', verify_msg)

      if (!verification.ok) {
        return verification
      }
    }

    if (user.email != new_email) {
      var email_valid = await intern.valid_email(seneca, new_email, ctx)
      if (!email_valid.ok) {
        return {
          ok: false,
          why: email_valid.why,
          details: {
            new_email: new_email,
            old_email: user.email,
          },
        }
      }

      user = await user.data$({ email: new_email }).save$()
    }

    var out = { ok: true, user: user }

    return out
  }
}
