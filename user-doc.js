// NOTE: validation is not defined here as that would require calling code to
// use seneca-doc

const Joi = require('@hapi/joi')

module.exports = {
  cmd_encrypt: {
    desc: 'Encrypt a plain text password string.',
    examples: {
      'password:foo,repeat:foo':
        'Result: {ok:true, pass:_encrypted-string_, salt:_string_}'
    },
    reply_desc: {
      ok: '_true_ if encryption succeeded',
      pass: 'encrypted password string',
      salt: 'salt value string'
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
  
  cmd_create_verify: {
    desc: 'Create a onetime short-lived verification token.'
  }
}
