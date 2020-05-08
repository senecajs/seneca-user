/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Joi = require('@hapi/joi')

const Shared = require('./shared')

const LN = require('seneca-msg-test').LN

var print_calls = false

module.exports = [
  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'alice',
    },
    out: {
      ok: true,
      items: Joi.array().length(2),
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'alice',
      active: false,
    },
    out: {
      ok: true,
      items: Joi.array().length(1),
    },
  },

  {
    print: print_calls,
    pattern: 'logout:user' + LN(),
    params: {
      handle: 'alice',
    },
    out: {
      ok: true,
      count: 2,
      batch: Joi.string().min(1),
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'alice',
      active: false,
    },
    out: {
      ok: true,
      items: Joi.array().length(3),
    },
  },

  // another bar:1 login
  {
    print: print_calls,
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        bar: 1,
      },
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', bar: 1 },
    },
  },

  // a bar:2 login
  {
    print: print_calls,
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        bar: 2,
      },
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', bar: 2 },
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'bob',
    },
    out: {
      ok: true,
      items: Joi.array().length(3),
    },
  },

  {
    print: print_calls,
    pattern: 'logout:user' + LN(),
    params: {
      handle: 'bob',
      logout_q: {
        bar: 1,
      },
      load_logins: true,
    },
    out: {
      ok: true,
      count: 2,
      batch: Joi.string().min(1),
      items: [
        { handle: 'bob', bar: 1 },
        { handle: 'bob', bar: 1 },
      ],
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'bob',
    },
    out: {
      ok: true,
      items: Joi.array()
        .ordered(Joi.object({ bar: 2 }).unknown())
        .length(1),
    },
  },

  {
    print: print_calls,
    pattern: 'logout:user' + LN(),
    params: {
      handle: 'not-bob',
    },
    out: {
      ok: false,
      why: 'user-not-found',
    },
  },

  {
    print: print_calls,
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        bar: 3,
      },
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', bar: 3 },
    },
  },

  // logs out all active
  {
    print: print_calls,
    name: 'logoutbob0',
    pattern: 'logout:user' + LN(),
    params: {
      handle: 'bob',
      load_logins: true,
    },
    out: {
      ok: true,
      count: 2,
      batch: Joi.string().min(1),
      items: [
        { handle: 'bob', bar: 2 },
        { handle: 'bob', bar: 3 },
      ],
    },
  },

  // won't auth inactive logins
  {
    print: print_calls,
    pattern: 'auth:user',
    params: {
      token: '`logoutbob0:out.items[0].token`',
    },
    out: {
      ok: false,
      why: 'login-inactive',
    },
  },

  {
    print: print_calls,
    name: 'bob-login-bar4',
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        bar: 4,
      },
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', bar: 4 },
    },
  },

  {
    print: print_calls,
    name: 'bob-login-bar5',
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        bar: 5,
      },
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', bar: 5 },
    },
  },

  {
    print: print_calls,
    pattern: 'logout:user' + LN(),
    params: {
      handle: 'bob',
      token: '`bob-login-bar4:out.login.token`',
      load_logins: true,
    },
    out: {
      ok: true,
      count: 1,
      batch: Joi.string().min(1),
      items: [{ handle: 'bob', bar: 4 }],
    },
  },

  {
    print: print_calls,
    pattern: 'logout:user' + LN(),
    params: {
      handle: 'bob',
      login_id: '`bob-login-bar5:out.login.id`',
      load_logins: true,
    },
    out: {
      ok: true,
      count: 1,
      batch: Joi.string().min(1),
      items: [{ handle: 'bob', bar: 5 }],
    },
  },
]
