/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  // const intern = ctx.intern

  return async function auth_user(msg) {
    var seneca = this

    var token = msg.token

    // TODO: should this be just `fields`
    // all login fields are loaded anyway, so can only apply to user
    var user_fields = msg.user_fields || []

    var login = await seneca.entity(ctx.sys_login).load$({ token: token })
    // console.log(login.data$())

    if (null == login) {
      return {
        ok: false,
        token: token,
        why: 'login-not-found',
      }
    }

    if (!login.active) {
      return {
        ok: false,
        token: token,
        why: 'login-inactive',
      }
    }

    // handle legacy logins
    var user_id = login.user_id || login.user
    var user_query = {
      id: user_id,
      fields$: [...new Set(ctx.standard_user_fields.concat(user_fields))],
    }

    var user = await seneca.entity(ctx.sys_user).load$(user_query)

    if (null == user) {
      return {
        ok: false,
        token: token,
        login_id: login.id,
        why: 'user-not-found',
      }
    }

    return {
      ok: true,
      user: user,
      login: login,
    }
  }
}
