const Joi = require('@hapi/joi')

var print_register = false

const Shared = require('./shared')

const LN = Shared.LN

module.exports = [
  {
    // can register with just an email
    name: 'uf0',
    pattern: 'register:user'+LN(),
    params: {
      email: 'foo@example.com'
    },
    out: {
      ok: true,
      user: {
        email: 'foo@example.com',
        handle: Joi.string().length(7)
      }
    }
  },

  // get:user without query returns nothing
  {
    pattern: 'get:user'+LN(),
    params: {},
    out: { ok: false }
  },

  //
  {
    pattern: 'get:user'+LN(),
    params: { handle: '' },
    err: { code: 'act_invalid_msg' }
  },

  // use convenience params
  {
    print: print_register,
    pattern: 'get:user'+LN(),
    params: { id: '`uf0:out.user.id`' },
    out: { ok: true, user: { email: 'foo@example.com' } }
  },

  // `user_id` is an alias for `id`
  {
    print: print_register,
    pattern: 'get:user'+LN(),
    params: { user_id: '`uf0:out.user.id`' },
    out: { ok: true, user: { email: 'foo@example.com' } }
  },

  {
    pattern: 'get:user'+LN(),
    params: { email: 'foo@example.com' },
    out: { ok: true, user: { email: 'foo@example.com' } }
  },

  // use a proper query
  {
    pattern: 'get:user'+LN(),
    params: { q: { email: 'foo@example.com' } },
    out: { ok: true, user: { email: 'foo@example.com' } }
  },

  // use query-by-example
  {
    pattern: 'get:user'+LN(),
    params: { user: { email: 'foo@example.com' } },
    out: { ok: true, user: { email: 'foo@example.com' } }
  },

  // use query-by-example
  {
    pattern: 'get:user'+LN(),
    params: { user_data: { email: 'foo@example.com' } },
    out: { ok: true, user: { email: 'foo@example.com' } }
  },

  {
    // can't register with short handle
    print: print_register,
    pattern: 'register:user'+LN(),
    params: {
      handle: 'al'
    },
    out: {
      ok: false,
      why: 'handle-too-short',
      handle: 'al',
      details: { handle_length: 2, minimum: 3 }
    }
  },

  {
    // can register with just handle
    name: 'ar0',
    pattern: 'register:user'+LN(),
    params: {
      handle: 'alice',
      user_data: {
        custom_field0: 'value0'
      }
    },
    out: { ok: true, user: { handle: 'alice', custom_field0: 'value0' } }
  },

  {
    // handle must be unique
    pattern: 'register:user'+LN(),
    params: {
      handle: 'alice'
    },
    out: { ok: false, why: 'handle-exists', handle: 'alice' }
  },

  // use convenience params
  {
    pattern: 'get:user'+LN(),
    params: { handle: 'alice' },
    out: { ok: true, user: { handle: 'alice' } }
  },

  // legacy
  {
    pattern: 'get:user'+LN(),
    params: { q: { nick: 'alice' } },
    out: { ok: true, user: { handle: 'alice' } }
  },

  // use a proper query
  {
    pattern: 'get:user'+LN(),
    params: { q: { handle: 'alice' } },
    out: { ok: true, user: { handle: 'alice' } }
  },

  {
    // convenience and user, custom fields
    pattern: 'register:user'+LN(),
    params: {
      handle: 'bob',
      user_data: {
        email: 'bob@example.com',
        foo: 1
      }
    },
    out: { ok: true, user: { handle: 'bob', email: 'bob@example.com', foo: 1 } }
  },

  // custom fields query
  {
    print: false,
    pattern: 'get:user'+LN(),
    params: { handle: 'bob', fields: ['foo'] },
    out: { ok: true, user: { handle: 'bob', email: 'bob@example.com', foo: 1 } }
  },

  {
    print: false,
    pattern: 'get:user'+LN(),
    params: { q: { handle: 'bob', fields$: ['foo'] } },
    out: { ok: true, user: { handle: 'bob', email: 'bob@example.com', foo: 1 } }
  },

  {
    print: false,
    pattern: 'get:user'+LN(),
    params: { q: { handle: 'not-bob', fields$: ['foo'] } },
    out: { ok: false, user: null }
  },

  {
    print: false,
    pattern: 'get:user'+LN(),
    params: { q: { fields$: ['foo'] } },
    out: { ok: false, user: null }
  },

  {
    // legacy nick->handle
    pattern: 'register:user'+LN(),
    params: {
      nick: 'cathy',
      user_data: {
        nick: 'cathy-overridden'
      }
    },
    out: { ok: true, user: { handle: 'cathy' } }
  },

  {
    // legacy nick->handle
    pattern: 'register:user'+LN(),
    params: {
      nick: 'derek-nope',
      handle: 'derek',
      user_data: {
        nick: 'derek-nope-nope',
        handle: 'derek-overridden'
      }
    },
    out: { ok: true, user: { handle: 'derek' } }
  },

  // convenience params nick->handle
  {
    pattern: 'get:user'+LN(),
    params: {
      nick: 'alice',
      q: { handle: 'alice-nope', nick: 'alice-overridden' }
    },
    out: { ok: true, user: { handle: 'alice' } }
  },

  {
    // always generate a handle
    pattern: 'register:user'+LN(),
    params: {},
    out: { ok: true, user: { handle: Joi.string().length(12) } }
  },

  {
    // always generate a handle
    pattern: 'register:user'+LN(),
    params: {
      user_data: {}
    },
    out: { ok: true, user: { handle: Joi.string().length(12) } }
  },

  {
    // always generate a handle
    pattern: 'register:user'+LN(),
    params: {
      user_data: {
        email: 'example.com'
      }
    },
    out: { ok: true, user: { handle: Joi.string().length(12) } }
  },

  {
    // always generate a handle
    pattern: 'register:user'+LN(),
    params: {
      user_data: {
        email: '@example.com'
      }
    },
    out: { ok: true, user: { handle: Joi.string().length(12) } }
  },

  {
    pattern: 'register:user'+LN(),
    params: {
      handle: ''
    },
    err: { code: 'act_invalid_msg' }
  }
]
