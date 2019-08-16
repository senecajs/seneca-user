// NOTE: validation is not defined here as that would require calling code to
// use seneca-doc

module.exports = {
  cmd_encrypt_password: {
    desc: 'Encrypt a plain text password string.',
    examples: {
      'password:foo,repeat:foo':
        'Result: {ok:true,pass:_encrypted-string_, salt:_string_}'
    },
    reply_desc: {
      ok: '_true_ if encryption succeeded',
      pass: 'encrypted password string',
      salt: 'salt value string'
    }
  },
  cmd_create_verify: {
    desc: 'Create a onetime short-lived verification token.',
  }
}
