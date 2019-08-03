const Joi = require('@hapi/joi')

module.exports = {
  cmd_encrypt_password: {
    desc: 'Encrypt a plain text password string.',
    examples: {
      'password:foo,repeat:foo':
        'Result: {ok:true,pass:_encrypted-string_, salt:_string_}'
    },
    validate: {
      password: Joi.string()
        .description('Password plain text string.'),
      repeat: Joi.string()
        .description('Password plain text string, repeated.')
    },
    reply_desc: {
      ok: '_true_ if encryption succeeded',
      pass: 'encrypted password string',
      salt: 'salt value string'
    }
  }
}
