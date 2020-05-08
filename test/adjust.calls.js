/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Joi = require('@hapi/joi')

var print_calls = false

var call = {}

const Shared = require('./shared')

const LN = require('seneca-msg-test').LN

module.exports = [
  // user not found
  {
    print: print_calls,
    pattern: 'adjust:user' + LN(),
    params: {},
    out: { ok: false, why: 'no-user-query' },
  },

  // user not found
  {
    print: print_calls,
    pattern: 'adjust:user' + LN(),
    params: {
      handle: 'not-a-user',
    },
    out: {
      ok: false,
      user: null,
    },
  },

  (call.get_alice_active = {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      q: {
        handle: 'alice',
        fields$: ['custom_field0'], // test retrieval of custom fields
      },
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: true },
    },
  }),
  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'alice',
      auto: true,
    },
    out: {
      ok: true,
      user: { handle: 'alice', active: true },
    },
  },

  // do nothing
  {
    print: print_calls,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'alice',
      },
    },
    out: {
      user: { handle: 'alice', active: true },
    },
  },

  call.get_alice_active,

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'alice',
    },
    out: {
      ok: true,
      items: Joi.array().length(1),
    },
  },

  // deactivate
  {
    print: print_calls,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'alice',
      },
      active: false,
      fields: ['custom_field0'], // test retrieval of custom fields
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: false },
    },
  },

  // confirm cannot login
  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'alice',
      auto: true,
    },
    out: {
      ok: false,
      why: 'user-not-active',
    },
  },

  // confirm no active logins
  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'alice',
    },
    out: {
      ok: true,
      items: Joi.array().length(0),
    },
  },

  // idempotent
  {
    print: print_calls,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'alice',
      },
      active: false,
      fields: ['custom_field0'],
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: false },
    },
  },

  // confirm not active
  {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      q: {
        handle: 'alice',
        fields$: ['custom_field0'],
      },
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: false },
    },
  },

  // adjust back to active
  {
    print: print_calls,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'alice',
      },
      active: true,
      fields: ['custom_field0'],
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: true },
    },
  },

  call.get_alice_active,

  // deactivate
  {
    print: print_calls,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'derek',
      },
      active: false,
    },
    out: {
      user: { handle: 'derek', active: false },
    },
  },

  // login code for derek...
  {
    print: print_calls,
    name: 'dereklogin0',
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'derek',
      kind: 'login',
      valid: true,
      unique: false,
      expire_point: new Date().getTime() + 10 * 60 * 1000,
    },
    out: {
      ok: true,
      verify: {
        code: Joi.string(),
        once: true,
        used: false,
      },
    },
  },

  // .. won't work, as not active

  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'derek',
      verify: '`dereklogin0:out.verify.code`',
    },
    out: {
      ok: false,
      user_id: Joi.string(),
      why: 'user-not-active',
    },
  },
]
