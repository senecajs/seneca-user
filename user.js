/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

// CHANGES FROM OLD VERSION (seneca-user):
// role:user -> sys:user, freeing up role:user for calling app
// move user fields to `user` sub prop
// all custom fields from `data`
// use Joi via seneca-doc for validation

// TODO:
// - convention: msg.data provides custom fields merged at top level - can be used for all msgs
// - support user_id arg at top level
// - cmd patterns: change:password, change:handle, change:email - logic to handle


const Assert = require('assert')

const Crypto = require('crypto')
const Nid = require('nid')
const Uuid = require('uuid')

// WARNING: this plugin is for *internal* use, DO NOT expose via an API.
// See the seneca-auth plugin for an example of an API that uses this plugin.

module.exports = user

module.exports.errors = {}


const intern = module.exports.intern = make_intern()

module.exports.defaults = {
  test: false,

  salt: {
    bytelen: 16,
    format: 'hex'
  },

  rounds: 11111,

  fields: {
    standard: ['handle','email','name','active'],
  },

  onetime: {
    expire: 15 * 60 * 1000 // 15 minutes
  },

  password: {
    minlen: 8
  },

  handle: {
    minlen: 3
  },

  limit: 111, // default result limit
  
  ensure_handle: intern.ensure_handle,
  make_handle: intern.make_handle,
  make_token: intern.make_token,

/*  
  // --- LEGACY BELOW ---
  
  rounds: 11111,
  autopass: true,
  mustrepeat: false,
  resetperiod: 86400000,
  confirm: false,
  oldsha: true,
  pepper: '',
  salt_strfmt: 'hex',
  failedLoginCount: null,
  user: {
    fields: [
      {
        name: 'pass',
        hide: true
      },
      {
        name: 'salt',
        hide: true
      }
    ]
  },
  login: {
    fields: []
  },
  reset: {
    fields: []
  },
  updateUser: {
    omit: [
      'role',
      'cmd',
      'nick',
      'email',
      'name',
      'active',
      'username',
      'password',
      'salt',
      'pass',
      'id',
      'confirmed',
      'confirmcode'
    ]
  },
  verify: {
    expire: 10 * 60 * 1000, // 10 minutes
    default_score: 0
  },
  onetime: {
    expire: 5 * 60 * 1000 // 5 minutes
  },
*/
  
}

function user(options) {
  var seneca = this
  var ctx = intern.make_ctx({}, options)

  // TODO: @seneca/audit - record user modifications - e.g activate
  
  seneca
    .fix('sys:user')
    .message('register:user', intern.make_msg('register_user', ctx))
    .message('get:user', intern.make_msg('get_user', ctx))
    .message('adjust:user', intern.make_msg('adjust_user', ctx))
    .message('login:user', intern.make_msg('login_user', ctx))
    .message('list:login', intern.make_msg('list_login', ctx))
    .message('hook:password,cmd:encrypt', intern.make_msg('cmd_encrypt', ctx))
    .message('hook:password,cmd:verify', intern.make_msg('cmd_verify', ctx))

  
  // NEXT
  //.message('logout:user', logout_user)
  //.message('change:password', change_password)
  //.message('change:handle', change_handle)
  //.message('change:email', change_email)


  

  

  
  return {
    exports: {
      find_user: async function(seneca, msg, special_ctx) {
        return intern.find_user(seneca, msg, Object.assign({},ctx,special_ctx||{}))
      }
    }
  }




  // async function login_user(msg) {
  //   var seneca = this

  //   var user = null
  //   var login_fields = msg.login // Optional extra fields to save with login.
    
  //   // Find the user.
  //   var found_user = get_user(this,msg)

  //   if(!found_user.ok) {
  //     return { ok: false, why: 'user-not-found' }
  //   } else {
  //     user = found_user.user
  //   }

  //   if(!user.active) {
      
  //   }
    
    /*
    // NOTE: assumes user is resolved (see resolve_user)
    var user = args.user
    var login_fields = args.login
    var why
    var loginent = seneca.make(login_canon)

    if (!user.active) {
      seneca.log.debug('login/fail', (why = 'not-active'), user)
      return done(null, { ok: false, why: why, user: user })
    }

    if (
      options.failedLoginCount &&
      user.failedLoginCount >= options.failedLoginCount
    ) {
      seneca.log.debug('login/fail', (why = 'locked-out'), user)
      return done(null, { ok: false, why: why })
    }
    if (args.auto) {
      return make_login(user, login_fields, 'auto')
    } else {
      seneca.act(
        {
          sys: 'user',
          cmd: 'verify_password',
          proposed: args.password,
          pass: user.pass,
          salt: user.salt
        },
        function(err, out) {
          if (err) return done(err)
          if (!out.ok) {
            seneca.log.debug('login/fail', (why = 'invalid-password'), user)
            cmd_increment_lock(seneca, user.id, false, function(err) {
              if (err) return done(err)
              done(null, { ok: false, why: why })
            })
          } else return make_login(user, login_fields, 'password')
        }
      )
    }

    function make_login(user, login_fields, why) {
      var login_data = {
        ...login_fields,
        id$: Uuid(),
        nick: user.nick,
        user: user.id,
        when: new Date().toISOString(),
        active: true,
        why: why
      }

      login_data.token = login_data.id$ // DEPRECATED

      if (args.onetime) {
        login_data.onetime_code = Uuid()
        login_data.onetime_active = true
        login_data.onetime_expiry = Date.now() + options.onetime.expire
      }

      var login = loginent.make$(login_data)

      login.save$(function(err, login) {
        if (err) return done(err)
        cmd_increment_lock(seneca, user.id, true, function(err) {
          if (err) return done(err)

          seneca.log.debug('login/ok', why, user, login)
          done(null, { ok: true, user: user, login: login, why: why })
        })
      })
    }

    */
//  }


  
  // --- LEGACY BELOW ---
/*
  var user_canon = 'sys/user'
  var login_canon = 'sys/login'
  var reset_canon = 'sys/reset'
  var verify_canon = 'sys/verify'

  var Joi = seneca.util.Joi

  
  // # Plugin options.
  // These are the defaults. You can override using the _options_ argument.
  // Example: `seneca.use("user",{mustrepeat:true})`.
  // var default_options = require('./default-options.json')

  // options = seneca.util.deepextend(default_options, options)

  // You can change the _role_ value for the plugin patterns.
  // Use this when you want to load multiple versions of the plugin
  // and expose them via different patterns.
  var pepper = options.pepper

  // # Action patterns
  // These define the pattern interface for this plugin.
  seneca.add('sys:user,cmd:encrypt_password', cmd_encrypt_password)
  seneca.add('sys:user,cmd:register', cmd_register)
  seneca.add('sys:user,cmd:login', resolve_user(cmd_login))
  seneca.add('sys:user,cmd:onetime_login', cmd_onetime_login)
  seneca.add('sys:user,cmd:create_verify', cmd_create_verify)
  seneca.add('sys:user,cmd:verify', cmd_verify)

  cmd_encrypt_password.validate = {
    password: Joi.string().description('Password plain text string.'),
    repeat: Joi.string().description('Password plain text string, repeated.')
  }

  cmd_create_verify.validate = {
    mode: Joi.string().description(
      'Verification mode: verify: normal, else hellban.'
    ),
    user: Joi.object({})
      .unknown()
      .description('User details'),
    score: Joi.number().optional(),
    expire: Joi.number().optional()
  }

  // Create a verification entry. Additional user action needed (such as email
  // link confirmation) before registration. Also records hell bans.
  function cmd_create_verify(msg, reply) {
    var seneca = this
    var user = msg.user

    var verifyent = seneca.make(verify_canon)

    // if hell ban, don't create a token, as verication is not possible
    // TODO: use a hash of salt+email+secret
    var token = 'verify' === msg.mode ? Uuid() : void 0
    var d = new Date()

    verifyent
      .make$(
        this.util.deep({}, msg.data, {
          active: true, // false once used
          token: token,
          mode: msg.mode,
          email: user.email,
          score: msg.score || options.verify.default_score,
          when: d.toISOString(),
          t_c: d.getTime(),
          expire: msg.expire || options.verify.expire,
          user: user
        })
      )
      .save$(function(err, verify) {
        reply(
          err || {
            ok: true,
            verify: verify
          }
        )
      })
  }

  // Check verification link to allow registration. Typically after user has clicked
  // on link in email
  function cmd_verify(msg, reply) {
    var seneca = this
    var token = msg.token

    if (null == token || '' == token) {
      reply({ ok: false, why: 'bad-token' })
    }

    var verifyent = seneca.make(verify_canon)

    verifyent.load$({ token: token }, function(err, verify) {
      if (err) return reply(err)

      if (null == verify) {
        return reply({ ok: false, why: 'not-found' })
      }

      var now = Date.now()
      var expired = !(
        !isNaN(verify.t_c) &&
        !isNaN(verify.expire) &&
        0 < verify.t_c &&
        verify.t_c < now &&
        now - verify.t_c < verify.expire
      )

      // one time use
      verify.active = false
      verify.t_closed = now
      verify.save$(function(err) {
        if (err) {
          return reply({ ok: false, why: 'active-err', user: verify.user })
        } else if (expired) {
          return reply({ ok: false, why: 'expired', user: verify.user })
        } else {
          return reply({ ok: true, user: verify.user })
        }
      })
    })
  }

  // Encrypt password using a salt and multiple SHA512 rounds
  // Override for password strength checking
  // - password: password string
  // - repeat: password repeat, optional
  // Provides: {pass:,salt:,ok:,why:}
  // use why if password too weak
  function cmd_encrypt_password(args, done) {
    // 128 bits of salt
    var salt = args.salt || generate_salt()
    var password = args.password

    // TODO: use a queue to rate limit
    Hasher(
      this,
      {
        test: options.test,
        src: pepper + password + salt,
        rounds: options.rounds
      },
      function(err, out) {
        var hashout = { ok: !err, pass: out.hash, salt: salt }
        done(err, hashout)
      }
    )
  }


  // LEGACY IMPLEMENTATIONS BELOW

  // ### Verify a password string
  // Pattern: _**sys**:user, **cmd**:verify_password_
  // Has the user entered the correct password?
  seneca.add(
    {
      sys: 'user',
      cmd: 'verify_password',

      proposed: { required$: true, string$: true },
      pass: { required$: true, string$: true },
      salt: { required$: true, string$: true }
    },
    cmd_verify_password
  )

  // ### Change password
  // Pattern: _**sys**:user, **cmd**:change_password_
  seneca.add(
    {
      sys: 'user',
      cmd: 'change_password',

      // identify user, various options
      atleastone$: ['nick', 'email', 'user', 'username'],
      nick: { string$: true },
      email: { string$: true },
      username: { string$: true },
      user: { type$: ['object', 'string'] },

      password: { string$: true, required$: true }, // new password plain text string
      repeat: { string$: true } // new password plain text string, repeated
    },
    resolve_user(cmd_change_password, true)
  )

  // ### Confirm user
  // Pattern: _**sys**:user, **cmd**:confirm_
  // Use confirmation code, provided to user by email (say), to confirm registration.
  seneca.add(
    {
      sys: 'user',
      cmd: 'confirm',

      code: { string$: true, required$: true } // confirmation code
    },
    cmd_confirm
  )

  // ### Authorize user
  // Pattern: _**sys**:user, **cmd**:auth_
  // Validates that the token exists and is active
  seneca.add(
    {
      sys: 'user',
      cmd: 'auth',

      token: { required$: true, string$: true } // login token
    },
    cmd_auth
  )

  // ### Logout user
  // Pattern: _**sys**:user, **cmd**:logout_
  // Mark token record in _sys/login_ as inactive
  seneca.add(
    {
      sys: 'user',
      cmd: 'logout',

      token: { required$: true, string$: true } // login token
    },
    cmd_logout
  )

  // ### Clean user data
  // Pattern: _**sys**:user, **cmd**:clean_
  // Remove sensitive data fields such as password hash.
  seneca.add(
    {
      sys: 'user',
      cmd: 'clean',

      user: { required$: true, entity$: user_canon } // sys/user entity
    },
    cmd_clean
  )

  // ### Create a password reset entry
  // Pattern: _**sys**:user, **cmd**:create_reset_
  // Create an entry in _sys/reset_ that provides a reset token
  seneca.add(
    { sys: 'user', cmd: 'create_reset' },
    resolve_user(cmd_create_reset, false)
  )

  // ### Load a password reset entry
  // Pattern: _**sys**:user, **cmd**:load_reset_
  // Load a _sys/reset_ entry by reset token
  seneca.add({ sys: 'user', cmd: 'load_reset' }, cmd_load_reset)

  // ### Execute a password reset
  // Pattern: _**sys**:user, **cmd**:execute_reset_
  // Execute a _sys/reset_ entry by reset token, providing the new password.
  seneca.add({ sys: 'user', cmd: 'execute_reset' }, cmd_execute_reset)

  // ### Update user details
  // Pattern: _**sys**:user, **cmd**:update_
  seneca.add({ sys: 'user', cmd: 'update' }, cmd_update)

  // ### Unlock user
  // Pattern: _**sys**:user, **cmd**:unlock_
  seneca.add({ sys: 'user', cmd: 'unlock' }, cmd_unlock)

  // ### Enable User - DEPRECATED
  // Replaced with **activate** command
  seneca.add(
    { sys: 'user', cmd: 'enable' }, // keep this for backward compatibility
    cmd_enable
  )

  // ### Activate user
  // Pattern: _**sys**:user, **cmd**:activate_
  seneca.add({ sys: 'user', cmd: 'activate' }, cmd_enable)

  // ### Disable User - DEPRECATED
  // Replaced with **deactivate** command
  seneca.add(
    { sys: 'user', cmd: 'disable' }, // keep this for backward compatibility
    cmd_disable
  )

  // ### Deactivate user
  // Pattern: _**sys**:user, **cmd**:deactivate_
  seneca.add({ sys: 'user', cmd: 'deactivate' }, cmd_disable)

  // ### Delete User - DEPRECATED
  // Replaced with **remove** command
  seneca.add(
    { sys: 'user', cmd: 'delete' }, // keep this for backward compatibility
    cmd_delete
  )

  // ### Remove user
  // Pattern: _**sys**:user, **cmd**:remove_
  seneca.add({ sys: 'user', cmd: 'remove' }, cmd_delete)

  // ### DEPRECATED
  seneca.add({ sys: 'user', cmd: 'entity' }, function(args, done) {
    var seneca = this
    var loginent = seneca.make(login_canon)

    var kind = args.kind || 'user'
    var ent = ('user' === kind ? seneca.make(user_canon) : loginent).make$()
    done(null, ent)
  })

  // Action Implementations

  // TODO: convert to async/await intern utility function
  function resolve_user(cmd, fail) {
    var outfunc = function(args, done) {
      var seneca = this
      var userent = seneca.make(user_canon)

      if (args.user && args.user.entity$) {
        return cmd.call(seneca, args, done)
      } else {
        var q = {}
        var valid = false

        if (args.email && args.nick) {
          // email wins
          if (args.email !== args.nick) {
            q.email = args.email
            valid = true
          } else if (~args.email.indexOf('@')) {
            q.email = args.email
            valid = true
          } else {
            q.nick = args.nick
            valid = true
          }
        } else if (args.email) {
          q.email = args.email
          valid = true
        } else if (args.nick) {
          q.nick = args.nick
          valid = true
        } else if (args.username) {
          q.nick = args.username
          valid = true
        } else if (args.user && !args.user.entity$) {
          q.id = args.user
          valid = true
        }

        if (!valid) {
          return done(null, { ok: false, why: 'nick_or_email_missing' })
        }

        // TODO: check q is not empty and fail if so - Defense in depth

        userent.load$(q, function(err, user) {
          if (err) return done(err)
          if (!user) {
            if (fail) {
              return done(seneca.error('user/not-found', q))
            } else
              return done(null, {
                ok: false,
                why: 'user-not-found',
                nick: q.nick,
                email: q.email
              })
          }

          if (Buffer.isBuffer(user.pass)) {
            user.pass = user.pass.toString('utf8')
          }

          args.user = user

          return cmd.call(seneca, args, done)
        })
      }
    }

    // keep docs working
    Object.defineProperty(outfunc, 'name', { value: cmd.name })
    return outfunc
  }

  function hide(args, propnames) {
    var outargs = Object.assign({}, args)
    for (var pn in propnames) {
      outargs[pn] = '[HIDDEN]'
    }
    return outargs
  }

  function prepare_password_data(seneca, args, done) {
    var password = void 0 === args.password ? args.pass : args.password
    var repeat = args.repeat

    if (null== password) {
      if (options.autopass) {
        password = Uuid()
      } else
        return done(null, {
          ok: false,
          code: 'user/no-password',
          whence: args.whence
        })
    }

    if (null == repeat) {
      if (options.mustrepeat) {
        return done(null, {
          ok: false,
          code: 'user/no-password-repeat',
          whence: args.whence
        })
      } else repeat = password
    }

    if (password !== repeat) {
      return done(null, {
        ok: false,
        why: 'password_mismatch',
        whence: args.whence
      })
    }

    seneca.act(
      'sys:user, cmd: encrypt_password',
      { password: password, salt: args.salt },
      done
    )
  }

  function generate_salt() {
    return Crypto.randomBytes(16).toString(options.salt_strfmt)
  }

  cmd_encrypt_password.descdata = function(args) {
    return hide(args, { password: 1, repeat: 1 })
  }

  // Verify proposed password is correct, redoing SHA512 rounds
  // - proposed: trial password string
  // - pass:     password hash
  // - salt:     password salt
  // Provides: {ok:}
  function cmd_verify_password(args, done) {
    seneca.act(
      {
        sys: 'user',
        cmd: 'encrypt_password',
        whence: 'verify_password/user=' + user.id + ',' + user.nick,
        password: args.proposed,
        salt: args.salt
      },
      function(err, out) {
        if (err) {
          return done(err)
        }
        if (!out.ok) {
          return done(err, out)
        }

        var pass = out.pass

        var ok = pass === args.pass

        return done(null, { ok: ok })
      }
    )
  }

  cmd_verify_password.descdata = function(args) {
    return hide(args, { proposed: 1 })
  }

  // TODO: accept user_id
  // Change password using user's nick or email
  // - nick, email: to resolve user
  // - user: user entity
  // - password: new password
  // - repeat: password repeat, optional
  // Provides: {ok:,user:}
  function cmd_change_password(args, done) {
    var seneca = this
    var user = args.user

    seneca.act(
      {
        sys: 'user',
        cmd: 'encrypt_password',
        whence: 'change/user=' + user.id + ',' + user.nick,
        password: args.password,
        repeat: args.repeat,
        salt: args.salt
      },
      function(err, out) {
        if (err) {
          return done(err)
        }
        if (!out.ok) {
          return done(null, out)
        }

        user.failedLoginCount = 0
        user.salt = out.salt
        user.pass = out.pass
        user.save$(function(err, user) {
          if (err) {
            return done(err)
          }

          user = user.data$(false)
          done(null, { ok: true, user: user })
        })
      }
    )
  }

  cmd_change_password.descdata = function(args) {
    return hide(args, { password: 1, repeat: 1 })
  }

  // Register a new user
  // - nick:     username, data store should ensure unique, alias: username, email used if not present
  // - email:    primary email address, data store should ensure unique
  // - name:     full name of user
  // - active:   status of user, active==true means login succeeds
  // - password: password text, alias: pass
  // - confirmed:  user already confirmed, default: false
  // Generated fields:
  // - when: date and time of registration
  // - confirmcode: used for confirmation
  // Provides:
  // - success: {ok:true,user:}
  // - failure: {ok:false,why:,nick:}
  function cmd_register(msg, done) {
    var seneca = this
    var args = msg.user

    var userent = seneca.make(user_canon)
    var user = userent.make$()
    var when = new Date()

    user.nick = args.nick || args.username || args.email
    user.email = args.email
    user.name = args.name || ''
    user.active = void 0 === args.active ? true : args.active

    user.when = when.toISOString()
    user.t_c = when.getTime()

    user.failedLoginCount = 0

    if (options.confirm) {
      user.confirmed = args.confirmed || false
      user.confirmcode = Uuid()
    }

    intern.conditional_extend(options, user, args)

    return checknick(function() {
      checkemail(function() {
        saveuser()
      })
    })

    // unsafe nick unique check, data store should also enforce !!
    function checknick(next) {
      if (user.nick) {
        userent.load$({ nick: user.nick }, function(err, userfound) {
          if (err) return done(err, { ok: false, user: user })
          if (userfound)
            return done(null, {
              ok: false,
              why: 'nick-exists',
              nick: args.nick
            })
          next()
        })
        return
      }
      next()
    }

    // unsafe email unique check, data store should also enforce !!
    function checkemail(next) {
      if (user.email) {
        userent.load$({ email: user.email }, function(err, userfound) {
          if (err) return done(err, { ok: false, user: user })
          if (userfound)
            return done(null, {
              ok: false,
              why: 'email-exists',
              nick: args.nick
            })
          next()
        })
        return
      }
      next()
    }

    function saveuser() {
      prepare_password_data(seneca, args, function(err, data) {
        if (err) {
          return done(err)
        }

        if (!data.ok) {
          return done(null, data)
        }

        user.salt = data.salt
        user.pass = data.pass

        // before saving user some cleanup should be done
        cleanUser(user, function(err, user) {
          if (err) {
            return done(err)
          }

          user.save$(function(err, user) {
            if (err) {
              return done(err)
            }

            seneca.log.debug('register', user.nick, user.email, user)
            done(null, { ok: true, user: user })
          })
        })
      })
    }
  }

  function cleanUser(user, done) {
    delete user.repeat
    done(null, user)
  }

  // Login an existing user - generates a login token. User must be active
  // - nick, email: to resolve user
  // - user:     user entity
  // - password: password text, alias: pass
  // Provides:
  // - success: {ok:true,user:,login:}
  // - failure: {ok:false,why:,user:}
  function cmd_login(args, done) {
    var seneca = this

    // NOTE: assumes user is resolved (see resolve_user)
    var user = args.user
    var login_fields = args.login
    var why
    var loginent = seneca.make(login_canon)

    if (!user.active) {
      seneca.log.debug('login/fail', (why = 'not-active'), user)
      return done(null, { ok: false, why: why, user: user })
    }

    if (
      options.failedLoginCount &&
      user.failedLoginCount >= options.failedLoginCount
    ) {
      seneca.log.debug('login/fail', (why = 'locked-out'), user)
      return done(null, { ok: false, why: why })
    }
    if (args.auto) {
      return make_login(user, login_fields, 'auto')
    } else {
      seneca.act(
        {
          sys: 'user',
          cmd: 'verify_password',
          proposed: args.password,
          pass: user.pass,
          salt: user.salt
        },
        function(err, out) {
          if (err) return done(err)
          if (!out.ok) {
            seneca.log.debug('login/fail', (why = 'invalid-password'), user)
            cmd_increment_lock(seneca, user.id, false, function(err) {
              if (err) return done(err)
              done(null, { ok: false, why: why })
            })
          } else return make_login(user, login_fields, 'password')
        }
      )
    }

    function make_login(user, login_fields, why) {
      var login_data = {
        ...login_fields,
        id$: Uuid(),
        nick: user.nick,
        user: user.id,
        when: new Date().toISOString(),
        active: true,
        why: why
      }

      login_data.token = login_data.id$ // DEPRECATED

      if (args.onetime) {
        login_data.onetime_code = Uuid()
        login_data.onetime_active = true
        login_data.onetime_expiry = Date.now() + options.onetime.expire
      }

      var login = loginent.make$(login_data)

      login.save$(function(err, login) {
        if (err) return done(err)
        cmd_increment_lock(seneca, user.id, true, function(err) {
          if (err) return done(err)

          seneca.log.debug('login/ok', why, user, login)
          done(null, { ok: true, user: user, login: login, why: why })
        })
      })
    }
  }

  function cmd_onetime_login(msg, reply) {
    var seneca = this
    var loginent = seneca.make(login_canon)
    var userent = seneca.make(user_canon)

    var onetime_code = msg.onetime

    loginent
      .make$()
      .load$({ onetime_code: onetime_code, onetime_active: true }, function(
        err,
        login
      ) {
        if (err) return reply(err)

        if (login) {
          if (Date.now() <= login.onetime_expiry) {
            login.onetime_active = false
            login.save$(function(err, login) {
              if (err) return reply(err)

              userent
                .make$()
                .load$(login.user_id || login.user, function(err, user) {
                  if (err) return reply(err)

                  if (user) {
                    reply({ ok: true, login: login, user: user })
                  } else {
                    reply({ ok: false, login: login, why: 'no-user' })
                  }
                })
            })
          } else {
            reply({ ok: false, why: 'expired' })
          }
        } else {
          reply({ ok: false, why: 'not-found' })
        }
      })
  }

  // Increments the number of failed login attempts
  // - id, user id to which to increment the failed attempts
  // - reset - boolean that says if the counter is reset to 0 or not
  // Provides:
  // - success: {ok:true}
  // - failure: {ok:false}
  function cmd_increment_lock(seneca, id, reset, done) {
    var userent = seneca.make(user_canon)

    userent.load$({ id: id }, function(err, user) {
      if (err) return done(err, { ok: false, why: err })

      if (reset) {
        user.failedLoginCount = 0
      } else {
        user.failedLoginCount++
      }
      user.save$(function(err, user) {
        if (err) return done(err, { ok: false, why: err })
        seneca.log.debug(
          'increment lock ',
          user,
          'failedLoginCount ',
          user.failedLoginCount
        )
        done(null, { ok: true })
      })
    })
  }

  // Unlocks accounts that a user has been locked out of due to failed password attempts
  // - id: user id to unlock
  // Provides:
  // - success: {ok:true}
  // - failure: {ok:false}
  function cmd_unlock(args, done) {
    var seneca = this
    cmd_increment_lock(seneca, args.id, true, function(err) {
      if (err) return done(err, { ok: false, why: err })
      done(null, { ok: true })
    })
  }

  // Confirm an existing user - using confirm code sent to user
  // - nick, email: to resolve user
  // - code: confirmcode
  // Provides:
  // - success: {ok:true,user:}
  // - failure: {ok:false,why:,nick:}
  function cmd_confirm(args, done) {
    var seneca = this
    var why
    var userent = seneca.make(user_canon)

    userent.load$({ confirmcode: args.code }, function(err, user) {
      if (err) return done(err)

      if (user) {
        if (user.active) {
          user.confirmed = true
          user.save$(function(err, user) {
            if (err) return done(err)
            done(null, { ok: true, user: user })
          })
        } else {
          seneca.log.debug(
            'confirm/fail',
            (why = 'not-active'),
            args.code,
            user
          )
          return done(null, { ok: false, why: why, user: user })
        }
      } else {
        seneca.log.debug(
          'confirm/fail',
          (why = 'invalid-code'),
          args.code,
          user
        )
        return done(null, { ok: false, why: why })
      }
    })
  }

  // Authorize an existing user - resolve using token
  // - token:    login token
  // Provides:
  // - success: {ok:true,user:,login:}
  // - failure: {ok:false,why:,token:}
  function cmd_auth(args, done) {
    var seneca = this
    var userent = seneca.make(user_canon)
    var loginent = seneca.make(login_canon)

    var q = { id: args.token }

    loginent.load$(q, function(err, login) {
      if (err) return done(err)

      if (!login) {
        return done(null, {
          ok: false,
          token: args.token,
          why: 'login-not-found'
        })
      }

      if (!login.active) {
        return done(null, {
          ok: false,
          token: args.token,
          why: 'login-inactive'
        })
      }

      userent.load$({ id: login.user }, function(err, user) {
        if (err) return done(err)

        if (!user) {
          return done(null, {
            ok: false,
            token: args.token,
            user: login.user,
            why: 'user-not-found'
          })
        }

        done(null, { user: user, login: login, ok: true })
      })
    })
  }

  // Logout an existing user - resolve using token, idempotent
  // - token:    login token
  // Provides:
  // - success: {ok:true,user:,login:}
  function cmd_logout(args, done) {
    var seneca = this
    var userent = seneca.make(user_canon)
    var loginent = seneca.make(login_canon)

    var q = { id: args.token }

    loginent.load$(q, function(err, login) {
      if (err) return done(err)

      if (!login) {
        return done(null, { ok: true })
      }

      login.active = false
      login.ended = new Date().getTime()
      login.save$(function(err, login) {
        if (err) {
          return done(err)
        }

        userent.load$({ id: login.user }, function(err, user) {
          if (err) {
            return done(err)
          }

          seneca.log.debug('logout', user, login)
          done(null, { user: user, login: login, ok: true })
        })
      })
    })
  }

  // Create a password reset token
  // - nick, email: to resolve user
  // - user:     user entity
  // Provides: {ok:,reset:,user:}
  function cmd_create_reset(args, done) {
    var seneca = this
    var user = args.user
    var why

    if (!user.active) {
      seneca.log.debug('create-reset/fail', (why = 'not-active'), user)
      return done(null, { ok: false, why: why, user: user })
    }

    var resetent = seneca.make(reset_canon)

    var token = Uuid()

    resetent
      .make$({
        id$: token,
        token: token,
        nick: user.nick,
        user: user.id,
        when: new Date().toISOString(),
        active: true
      })
      .save$(function(err, reset) {
        if (err) {
          return done(null, { ok: false, why: err })
        }

        done(null, {
          reset: reset.data$(false),
          user: user.data$(false),
          ok: true
        })
      })
  }

  // Load a password reset token
  // - token: reset token string
  // Provides: {ok:,reset:,user:}
  function cmd_load_reset(args, done) {
    var seneca = this
    var userent = seneca.make(user_canon)
    var resetent = seneca.make(reset_canon)

    var q = { token: args.token }

    resetent.load$(q, function(err, reset) {
      if (err) {
        return done(null, { ok: false, why: err })
      }

      if (!reset) {
        return done(null, {
          ok: false,
          token: args.token,
          why: 'reset-not-found'
        })
      }
      reset = reset.data$(false)

      userent.load$({ id: reset.user }, function(err, user) {
        if (err) {
          return done(null, { ok: false, why: err })
        }

        if (!user) {
          return done(null, {
            ok: false,
            token: args.token,
            user: reset.user,
            why: 'user-not-found'
          })
        }
        user = user.data$(false)

        done(null, { user: user, reset: reset, ok: true })
      })
    })
  }

  // Execute a password change using a reset token
  // - token: reset token string
  // - password: new password
  // - repeat: password repeat, optional
  // Provides: {ok:,reset:,user:}
  function cmd_execute_reset(args, done) {
    var seneca = this
    var resetent = seneca.make(reset_canon)
    var userent = seneca.make(user_canon)

    var q = { id: args.token }

    resetent.load$(q, function(err, reset) {
      if (err) {
        return done(err)
      }

      if (!reset) {
        return done(null, {
          ok: false,
          token: args.token,
          why: 'reset-not-found'
        })
      }

      if (!reset.active) {
        return done(null, {
          ok: false,
          token: args.token,
          why: 'reset-not-active'
        })
      }

      if (new Date() < new Date(reset.when) + options.resetperiod) {
        return done(null, { ok: false, token: args.token, why: 'reset-stale' })
      }

      userent.load$({ id: reset.user }, function(err, user) {
        if (err) {
          return done(null, { ok: false, token: args.token, why: err })
        }

        if (!user) {
          return done(null, { ok: false, why: 'user-not-found' })
        }

        seneca.act(
          {
            sys: 'user',
            cmd: 'change_password',
            user: user,
            password: args.password,
            repeat: args.repeat,
            salt: args.salt
          },
          function(err, out) {
            if (err) {
              return done(err)
            }

            if (!out.ok) {
              return done(null, out)
            }

            reset.active = false

            reset.save$(function(err, reset) {
              if (err) {
                return done(null, { ok: false, why: err })
              }

              reset = reset.data$(false)
              user = user.data$(false)

              seneca.log.debug(
                'reset',
                reset.id,
                user.id,
                user.nick,
                user,
                reset
              )
              done(null, { user: user, reset: reset, ok: true })
            })
          }
        )
      })
    })
  }

  function cmd_delete(args, done) {
    var seneca = this
    var userent = seneca.make(user_canon)
    var loginent = seneca.make(login_canon)
    var resetent = seneca.make(reset_canon)

    var user = userent.make$()

    var q = {}

    if (args.nick) {
      q.nick = args.nick
    } else if (args.email) {
      q.email = args.email
    } else {
      return done({ err: 'cannot identify user to delete' })
    }

    user.load$(q, function(err, user) {
      if (err) return done(err, { ok: false })
      if (!user) return done(null, { ok: false, exists: false })

      var nick = user.nick
      q = { nick: nick }
      // delete from login
      var login = loginent.make$()
      login.remove$(q, function(err) {
        if (err) return seneca.log.warn(err)

        // delete now from resetent
        var reset = resetent.make$()
        reset.remove$(q, function(err) {
          if (err) return seneca.log.warn(err)

          user.remove$(q, function(err) {
            if (err) return done(err, { ok: false })
            done(null, { ok: true })
          })
        })
      })
    })
  }

  function cmd_update(args, done) {
    var seneca = this
    var userent = seneca.make(user_canon)

    var user = userent.make$()

    var q = {}

    args.orig_nick = args.orig_nick || args.nick
    if (args.orig_nick) {
      q.nick = args.orig_nick
    } else {
      q.email = args.orig_email || args.email
    }

    user.load$(q, function(err, user) {
      if (err) return done(err, { ok: false, why: err })
      if (!user) return done(null, { ok: false, exists: false })

      delete args.orig_nick
      delete args.orig_email

      return changepwd(function() {
        checknick(function() {
          checkemail(function() {
            updateuser(user)
          })
        })
      })

      function changepwd(next) {
        var pwd = args.password || ''
        var pwd2 = args.repeat || ''

        if (pwd) {
          if (pwd === pwd2 && 1 < pwd.length) {
            seneca.act(
              'sys:user, cmd: change_password',
              Object.assign({}, q, { password: pwd }),
              function(err, userpwd) {
                if (err) return done(err, { ok: false, why: err })
                user.pass = userpwd.user.pass
                user.salt = userpwd.user.salt
                next()
              }
            )
          } else {
            return done(null, { ok: false, why: 'user/password_mismatch' })
          }
        } else next()
      }

      // unsafe nick unique check, data store should also enforce !!
      function checknick(next) {
        if (args.nick) {
          userent.list$({ nick: args.nick }, function(err, users) {
            if (err) return done(err, { ok: false, user: user })
            for (var i = 0; i < users.length; i++) {
              var each = users[i]
              if (each.id !== user.id) {
                return done(null, {
                  ok: false,
                  why: 'nick-exists',
                  nick: args.nick
                })
              }
            }

            next()
          })
          return
        }
        next()
      }

      // unsafe email unique check, data store should also enforce !!
      function checkemail(next) {
        if (args.email) {
          userent.list$({ email: args.email }, function(err, users) {
            if (err) return done(err, { ok: false, user: user })
            for (var i = 0; i < users.length; i++) {
              var each = users[i]
              if (each.id !== user.id) {
                return done(null, {
                  ok: false,
                  why: 'email-exists',
                  nick: args.nick
                })
              }
            }

            next()
          })
          return
        }
        next()
      }

      function updateuser(pwdupdate) {
        user.nick = args.nick || pwdupdate.nick
        user.name = args.name || pwdupdate.name
        user.email = args.email || pwdupdate.email

        user.salt = pwdupdate.salt
        user.pass = pwdupdate.pass

        if ('' === user.nick) {
          done(null, { ok: false, why: 'empty_nick' })
        } else if ('' === user.email) {
          done(null, { ok: false, why: 'empty_email' })
        } else {
          intern.conditional_extend(options, user, args)

          // before saving user some cleanup should be done
          cleanUser(user, function(err, user) {
            if (err) {
              return done(null, { ok: false, why: err })
            }

            user.save$(function(err, user) {
              done(err, { ok: !err, user: user.data$(false) })
            })
          })
        }
      }
    })
  }

  function cmd_disable(args, done) {
    cmd_change_active.call(this, args, false, done)
  }

  function cmd_enable(args, done) {
    cmd_change_active.call(this, args, true, done)
  }

  function cmd_change_active(args, active, done) {
    var seneca = this
    var userent = seneca.make(user_canon)

    var user = userent.make$()

    var q = {}

    if (args.nick) {
      q.nick = args.nick
    } else if (args.email) {
      q.email = args.email
    }

    if (!q.nick && !q.email) {
      return done(null, { ok: false, why: 'cannot-identify-user' })
    }

    user.load$(q, function(err, user) {
      if (err) return done(err, { ok: false })
      if (!user) return done(null, { ok: false, exists: false })

      user.active = active
      user.save$(function(err, user) {
        done(err, { ok: !err, user: user })
      })
    })
  }

  // DEPRECATED - do this in seneca-auth
  function cmd_clean(args, done) {
    var user = args.user.data$()
    delete user.pass
    delete user.salt
    delete user.active
    delete user.$
    done(null, user)
  }
  */
}

function make_intern() {
  return {
    make_msg: function(msg_fn, ctx) {
      return require('./lib/'+msg_fn)(ctx)
    },
    
    make_ctx: function(initial_ctx, options) {
      Assert(initial_ctx)
      Assert(options)

      return Object.assign({
        intern: intern,
        options: options,

        // Standard entity canons
        sys_user: 'sys/user',
        sys_login: 'sys/login',
        sys_reset: 'sys/reset',
        sys_verify: 'sys/verify',
  
        // Standard user fields to load - keep data volume low by default
        standard_user_fields: options.fields.standard,
        
        // Convenience query fields - msg.email etc.
        convenience_fields: 'id,user_id,email,handle,name'.split(',')
      },initial_ctx)
    },

    find_user: async function(seneca, msg, ctx) {
      // User may already be provided in parameters.
      var user = msg.user && msg.user.entity$ ? msg.user : null
      
      if(null == user) {
        msg = intern.fix_nick_handle(msg)

        var why = null

        // allow use of `q` to specify query, or `user` prop (q has precedence)
        var q = Object.assign({},msg.user||{},msg.user_data||{},msg.q||{})
        
        ctx.convenience_fields.forEach(f => null != msg[f] && (q[f]=msg[f]))

        // `user_id` is an alias for `id`
        if(null == q.id && null != q.user_id) {
          q.id = q.user_id
        }
        delete q.user_id
        
        // TODO: waiting for fix: https://github.com/senecajs/seneca-entity/issues/57

        if (0 < Object.keys(seneca.util.clean(q)).length) {
          // Add additional fields to standard fields.
          var fields = Array.isArray(msg.fields) ? msg.fields : []
          q.fields$ = [...new Set((q.fields$ || fields)
                                  .concat(ctx.standard_user_fields))]

          // These are the unique fields
          if(null == q.id && null == q.handle && null == q.email ) {
            var users = await seneca.entity(ctx.sys_user).list$(q)

            if(1 === users.length) {
              user = intern.fix_nick_handle(users[0])
            }
            else if(1 < users.length) {
              // This is bad, as you could operate on another user
              why = 'multiple-matching-users'
            }
          }
          else {
            // Use load$ to trigger entity cache
            user = await seneca.entity(ctx.sys_user).load$(q)
          }
        }
        else {
          why = 'no-query'
        }
      }
      
      var out = { ok: null != user, user: user || null }
      if(null == user) {
        out.why = why || 'user-not-found'
      }

      return out
    },


    build_pass_fields: async function(seneca,msg,ctx) {
      var pass = null != msg.pass ? msg.pass : msg.password
      var repeat = msg.repeat // optional
      var salt = msg.salt
      
      if('string'===typeof(repeat) && repeat !== pass) {
        return {ok:false,why:'repeat-password-mismatch'}
      }

      var res = await seneca.post('sys:user,hook:password,cmd:encrypt', {
        pass: pass,
        salt: salt
      })

      if(res.ok) {
        return {ok:true, fields:{
          pass: res.pass,
          salt: res.salt
        }}
      }
      else {
        return {
          ok:false,
          why:res.why,

          /* $lab:coverage:off$ */
          details:res.details||{}
          /* $lab:coverage:on$ */
        }
      }
    },
    
    generate_salt: function (options) {
      return Crypto
        .randomBytes(options.salt.bytelen)
        .toString(options.salt.format)
    },

    // Automate migration of nick->handle. Removes nick.
    // Assume update value will be saved elsewhere in due course.
    fix_nick_handle: function(data) {
      if(null == data) {
        return data
      }

      if(null != data.nick) {
        data.handle = null != data.handle ? data.handle : data.nick
        delete data.nick
      }
      
      if(null != data.user && null != data.user.nick) {
        data.user.handle =
          null != data.user.handle ? data.user.handle : data.user.nick
        delete data.user.nick
      }

      if(null != data.user_data && null != data.user_data.nick) {
        data.user_data.handle =
          null != data.user_data.handle ? data.user_data.handle : data.user_data.nick
        delete data.user_data.nick
      }

      if(null != data.q && null != data.q.nick) {
        data.q.handle = null != data.q.handle ? data.q.handle : data.q.nick
        delete data.q.nick
      }
      
      return data
    },

    // NOTE: modifies msg if needed to ensure consistency
    ensure_handle: function(msg, options) {
      var user_data = msg.user_data || msg.user || {}
      var handle = null == msg.handle ? user_data.handle : msg.handle

      if('string' != typeof(handle)) {
        var email = msg.email || user_data.email || null

        if('string' == typeof(email) && email.includes('@')) {
          handle = email.split('@')[0].toLowerCase() +
            ('' + Math.random()).substring(2, 6)
        }
        else {
          handle = options.make_handle()
        }

        // there was nothing before the @
        if(4 === handle.length) {
          handle = options.make_handle()
        }
      }

      msg.handle = handle
      user_data.handle = handle
      
      return handle
    },

    make_handle: Nid({length:'12',alphabet:'abcdefghijklmnopqrstuvwxyz'}),

    
    make_token: Uuid.v4,  // Random! Don't leak things.
    
    
    make_login: async function(spec) {

      /* $lab:coverage:off$ */
      var seneca = Assert(spec.seneca) || spec.seneca
      var user = Assert(spec.user) || spec.user
      var why = Assert(spec.why) || spec.why
      var ctx = Assert(spec.ctx) || spec.ctx
      var options = Assert(ctx.options) || ctx.options
      /* $lab:coverage:on$ */

      var login_data = spec.login_data || {} // custom data fields
      var onetime = !!spec.onetime

      var full_login_data = {
        // custom data fields for login entry
        ...login_data,

        // token field should be indexed for quick lookups
        token: options.make_token(),

        // deliberately copied
        handle: user.handle,
        email: user.email,
        
        user_id: user.id,

        when: new Date().toISOString(),

        active: true,
        why: why
      }

      if (onetime) {
        full_login_data.onetime_active = true
        full_login_data.onetime_token = options.make_token(),
        full_login_data.onetime_expiry = Date.now() + options.onetime.expire
      }

      var login = await seneca.entity(ctx.sys_login).data$(full_login_data).save$()

      return login
    },


    load_user_fields: function(msg,...rest) {
      var fields = rest.flat().filter(f=>'string'===typeof(f)&&0<f.length)
      msg.q = msg.q||{}
      msg.q.fields$ = (msg.q.fields$||[])
      msg.q.fields$ = msg.q.fields$.concat(fields)
      msg.q.fields$ = [...new Set(msg.q.fields$)] // remove dups
      return msg
    },
    
/*
    conditional_extend: function(options, user, args) {
      var extra = Object.assign({}, args)
      var omit = options.updateUser.omit || []
      omit.forEach(key=>delete extra[key])
      
      for (let [key, val] of Object.entries(extra)) {
        if (!key.match(/\$/)) {
          user[key] = val
        }
      }
    }
*/
  }
}

