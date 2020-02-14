// NOTE: validation is not defined here as that would require calling code to
// use seneca-doc

const Joi = require('@hapi/joi')

module.exports = {
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
      pass: Joi.string().min(1).optional(),
      password: Joi.string().min(1).optional(),
      rounds: Joi.number().optional(),
    }
  },

  get_user: {
    desc: 'Get user details',
    reply_desc: {
      ok: '_true_ if user found',
      user: 'user entity',
    },
    validate: {
      handle: Joi.string().min(1).optional(),
      nick: Joi.string().min(1).optional(),
      q: Joi.object().optional()
    }
  },
  
  register_user: {
    desc: 'Register a new user',
    reply_desc: {
      ok: '_true_ if user registration succeeded',
      user: 'user entity',
    },
    validate: {
      email: Joi.string().optional(),
      handle: Joi.string().optional(),
      nick: Joi.string().optional(), // legacy
      user: Joi.object({
        email: Joi.string().optional(),
        handle: Joi.string().optional(),
        nick: Joi.string().optional(), // legacy
      }).unknown()
    }
  }


      //desc: 'Create a onetime short-lived verification token.'
}
