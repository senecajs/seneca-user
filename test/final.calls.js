/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Joi = require('@hapi/joi')

const Shared = require('./shared')

const print_calls = false

const LN = require('seneca-msg-test').LN

module.exports = [
  {
    print: print_calls,
    pattern: 'list:user' + LN(),
    out: {
      ok: true,
      items: [
        { email: 'foo@example.com', active: true },
        { name: 'alice', handle: 'alice', active: true },
        { name: 'bob', email: 'bob@example.com', handle: 'bob', active: true },
        {
          name: 'cathy',
          handle: 'catherine',
          email: 'catherinethegreat@example.com',
          active: true,
        },
        { name: 'derek', handle: 'derek', active: false },
        { active: true },
        { active: true },
        { active: true },
        { name: 'Adam Ant', active: true },
        {
          name: 'edward',
          handle: 'edward',
          email: 'edward@example.com',
          active: true,
        },
        {
          name: 'frank',
          handle: 'frankly',
          email: 'frankly@example.com',
          active: true,
        },
      ],
    },
  },

  {
    print: print_calls,
    pattern: 'list:user' + LN(),
    params: {
      q: {
        foo: 1,
      },
    },
    out: {
      ok: true,
      items: [
        {
          name: 'bob',
          email: 'bob@example.com',
          foo: 1,
          handle: 'bob',
          active: true,
        },
        {
          name: 'frank',
          foo: 1,
          handle: 'frankly',
          email: 'frankly@example.com',
          active: true,
        },
      ],
    },
  },

  {
    print: print_calls,
    pattern: 'list:user' + LN(),
    params: {
      active: false,
    },
    out: {
      ok: true,
      items: [{ name: 'derek', handle: 'derek', active: false }],
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'edward',
      user: {
        address: 'edward house',
      },
    },
    out: {
      ok: true,
    },
  },

  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'edward',
      fields: ['address'],
      auto: true,
    },
    out: {
      ok: true,
      user: { address: 'edward house' },
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'edward',
    },
    out: {
      ok: true,
      items: Joi.array().length(2),
    },
  },

  {
    print: print_calls,
    name: 're0',
    pattern: 'remove:user' + LN(),
    params: {
      handle: 'edward',
    },
    out: {
      ok: true,
      login_count: 2,
      removed: Joi.string(),
      purged: false,
      user_id: Joi.string(),
    },
  },

  {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      user_id: '`re0:out.user_id`',
      q: { fields$: ['address'] },
    },
    out: {
      ok: true,
      user: {
        active: false,
        removed: Joi.string(),
        handle: Joi.string().invalid('edward').length(12),
        address: 'edward house',
      },
    },
  },

  // can run multiple times, custom anon fields
  {
    print: print_calls,
    name: 're0',
    pattern: 'remove:user' + LN(),
    params: {
      user_id: '`re0:out.user_id`',
      q: { fields$: ['address'] },
      anon_fields: ['address'],
    },
    out: {
      ok: true,
      login_count: 2,
      removed: Joi.string(),
      purged: false,
      user_id: Joi.string(),
    },
  },

  {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      user_id: '`re0:out.user_id`',
      q: { fields$: ['address'] },
    },
    out: {
      ok: true,
      user: {
        active: false,
        removed: Joi.string(),
        handle: Joi.string().invalid('edward').length(12),
        address: Joi.string().invalid('edward house').length(12),
      },
    },
  },

  // explicitly purge data
  {
    print: print_calls,
    name: 're0',
    pattern: 'remove:user' + LN(),
    params: {
      user_id: '`re0:out.user_id`',
      purge: true,
    },
    out: {
      ok: true,
      login_count: 2,
      removed: Joi.string(),
      purged: true,
      user_id: Joi.string(),
    },
  },

  {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      user_id: '`re0:out.user_id`',
    },
    out: {
      ok: false,
      why: 'user-not-found',
    },
  },

  {
    print: print_calls,
    name: 're0',
    pattern: 'remove:user' + LN(),
    params: {
      user_id: '`re0:out.user_id`',
    },
    out: {
      ok: false,
      why: 'user-not-found',
    },
  },

  {
    // sanitize handle from email
    pattern: 'register:user' + LN(),
    print: print_calls,
    params: {
      user: {
        email: 'gothic.gallifrey@example.com',
      },
    },
    out: {
      ok: true,
      user: {
        handle: 'gothic_gallifre',
        email: 'gothic.gallifrey@example.com',
      },
    },
  },
]
