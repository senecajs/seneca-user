// NOTE: validation is not defined here as that would require calling code to
// use seneca-doc

const Joi = require('@hapi/joi')

const query_user = {
  id: Joi.string()
    .min(1)
    .optional(),
  user_id: Joi.string()
    .min(1)
    .optional(),
  email: Joi.string()
    .email()
    .optional(),
  handle: Joi.string()
    .min(1)
    .optional(),
  nick: Joi.string()
    .min(1)
    .optional(),
  q: Joi.object().optional(),
  fields: Joi.array()
    .items(Joi.string())
    .optional()
}

const user_data = {
  email: Joi.string()
    .email()
    .optional(),
  handle: Joi.string().optional(),
  nick: Joi.string().optional() // legacy
}

module.exports = {
  register_user: {
    desc: 'Register a new user',
    reply_desc: {
      ok: '_true_ if user registration succeeded',
      user: 'user entity'
    },
    validate: {
      ...user_data,
      user: Joi.object({
        ...user_data
      }).unknown(),
      user_data: Joi.object({
        ...user_data
      }).unknown()
    }
  },

  get_user: {
    desc: 'Get user details',
    reply_desc: {
      ok: '_true_ if user found',
      user: 'user entity'
    },
    validate: query_user
  },

  list_user: {
    desc: 'List users',
    reply_desc: {
      ok: '_true_ if user found',
      user: 'user entity'
    },
    validate: {
      active: Joi.boolean().optional(),
      q: Joi.object().optional()
    }
  },

  adjust_user: {
    desc: 'Adjust user status idempotently (activated, etc.).',
    reply_desc: {
      ok: '_true_ if user found',
      user: 'user entity'
    },
    validate: Object.assign(
      {
        active: Joi.boolean().optional()
      },
      query_user
    )
  },

  login_user: {
    desc: 'Login user',
    reply_desc: {
      ok: '_true_ if user logged in',
      user: 'user entity',
      login: 'login entity'
    },
    validate: {
      ...query_user,
      auto: Joi.boolean().optional(),
      pass: Joi.string().optional(),
      fields: Joi.array()
        .items(Joi.string())
        .optional()
    }
  },

  logout_user: {
    desc: 'Login user',
    reply_desc: {
      ok: '_true_ if user logged in',
      count: 'number of logouts'
    },
    validate: {
      ...query_user,
      token: Joi.string().optional(),
      login_in: Joi.string().optional(),
      login_q: Joi.object()
        .optional()
        .default({}),
      load_logins: Joi.boolean().optional()
    }
  },

  cmd_encrypt: {
    desc: 'Encrypt a plain text password string.',
    examples: {
      'pass:foofoobarbar':
        'Result: {ok:true, pass:_encrypted-string_, salt:_string_}'
    },
    reply_desc: {
      ok: '_true_ if encryption succeeded',
      pass: 'encrypted password string',
      salt: 'salt value string'
    },
    validate: {
      salt: Joi.string().optional(),
      pass: Joi.string()
        .min(1)
        .optional(),
      password: Joi.string()
        .min(1)
        .optional(),
      rounds: Joi.number().optional()
    }
  },

  check_exists: {
    desc: 'Check user exists.',
    reply_desc: {
      ok: '_true_ if user exists',
      user: 'user entity'
    },
    validate: query_user
  },

  make_verify: {
    desc: 'Create a verification entry (multiple use cases).',
    reply_desc: {
      ok: '_true_ if user found',
      verify: 'verify entity'
    },
    validate: Object.assign(
      {
        kind: Joi.string().min(1),
        code: Joi.string()
          .min(1)
          .optional(),
        once: Joi.boolean().optional(),
        valid: Joi.boolean().optional(),
        custom: Joi.object().optional(),
        expire_point: Joi.number().optional(),
        expire_duration: Joi.number().optional()
      },
      query_user
    )
  },
  change_handle: {
    desc: 'Change user handle.',
    reply_desc: {
      ok: '_true_ if changed',
      user: 'user entity'
    },
    validate: Object.assign(
      {
        new_handle: Joi.string().min(1)
      },
      query_user
    )
  },
  change_email: {
    desc: 'Change user email.',
    reply_desc: {
      ok: '_true_ if changed',
      user: 'user entity'
    },
    validate: Object.assign(
      {
        new_email: Joi.string()
          .email()
          .min(1)
      },
      query_user
    )
  }
}
