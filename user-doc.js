// NOTE: validation is not defined here as that would require calling code to
// use seneca-doc

module.exports = {
  adjust_user: {
    desc: 'Adjust user status idempotently (activated, etc.).',
    reply_desc: {
      ok: '_true_ if user found',
      user: 'user entity',
    },
  },

  auth_user: {
    desc: 'Authenticate a login using token',
    reply_desc: {
      ok: '_true_ if login is active',
      user: 'user entity',
      login: 'user entity',
    },
  },

  register_user: {
    desc: 'Register a new user',
    reply_desc: {
      ok: '_true_ if user registration succeeded',
      user: 'user entity',
    },
  },

  get_user: {
    desc: 'Get user details',
    reply_desc: {
      ok: '_true_ if user found',
      user: 'user entity',
    },
  },

  remove_user: {
    desc: 'Remove a user',
    reply_desc: {
      ok: '_true_ if user removed',
      user: 'user entity',
    },
  },

  update_user: {
    desc: 'Update a user',
    reply_desc: {
      ok: '_true_ if user updated',
      user: 'user entity',
    },
  },

  list_user: {
    desc: 'List users',
    reply_desc: {
      ok: '_true_ if user found',
      items: 'user entity item list',
    },
  },

  list_login: {
    desc: 'List logins for a user',
    reply_desc: {
      ok: '_true_ if user found',
      items: 'user entity item list',
    },
  },

  login_user: {
    desc: 'Login user',
    reply_desc: {
      ok: '_true_ if user logged in',
      user: 'user entity',
      login: 'login entity',
    },
  },

  logout_user: {
    desc: 'Login user',
    reply_desc: {
      ok: '_true_ if user logged in',
      count: 'number of logouts',
    },
  },

  cmd_encrypt: {
    desc: 'Encrypt a plain text password string.',
    examples: {
      'pass:foofoobarbar':
        'Result: {ok:true, pass:_encrypted-string_, salt:_string_}',
    },
    reply_desc: {
      ok: '_true_ if encryption succeeded',
      pass: 'encrypted password string',
      salt: 'salt value string',
    },
  },

  check_exists: {
    desc: 'Check user exists.',
    reply_desc: {
      ok: '_true_ if user exists',
      user: 'user entity',
    },
  },

  make_verify: {
    desc: 'Create a verification entry (multiple use cases).',
    reply_desc: {
      ok: '_true_ if user found',
      verify: 'verify entity',
    },
  },

  change_handle: {
    desc: 'Change user handle.',
    reply_desc: {
      ok: '_true_ if changed',
      user: 'user entity',
    },
  },

  change_email: {
    desc: 'Change user email.',
    reply_desc: {
      ok: '_true_ if changed',
      user: 'user entity',
    },
  },

  change_pass: {
    desc: 'Change user password.',
    reply_desc: {
      ok: '_true_ if changed',
      user: 'user entity',
    },
  },

  check_verify: {
    desc: 'Check a verfication entry.',
    reply_desc: {
      ok: '_true_ if valid',
      why: 'string coded reason if not valid',
    },
  },

  cmd_pass: {
    desc: 'Validate a plain text password string.',
    examples: {
      'pass:goodpassword': 'Result: {ok:true}',
    },
    reply_desc: {
      ok: '_true_ if password is valid',
      why: 'string coded reason if not valid',
    },
  },
}
