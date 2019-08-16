/* Copyright (c) 2012-2019 Richard Rodger, MIT License */
'use strict'

// CHANGES FROM OLD VERSION (seneca-user):
// move user fields to `user` sub prop
// all custom fields from `data`
// use Joi via seneca-doc for validation

// TODO:
// - convention: msg.data provides custom fields merged at top level - can be used for all msgs

var Crypto = require('crypto')

var _ = require('lodash')
var Uuid = require('uuid')

const Hasher = require('./lib/hasher.js')

// WARNING: this plugin is for *internal* use, DO NOT expose via an API.
// See the seneca-auth plugin for an example of an API that uses this plugin.

module.exports = user

module.exports.errors = {}

module.exports.defaults = {
  test: false,
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
  }
}

function user(options) {
  var seneca = this
  var Joi = seneca.util.Joi

  var user_canon = 'sys/user'
  var login_canon = 'sys/login'
  var reset_canon = 'sys/reset'
  var verify_canon = 'sys/verify'

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
  seneca.add('sys:user,cmd:create_verify', cmd_create_verify)

  cmd_encrypt_password.validate = {
    password: Joi.string().description('Password plain text string.'),
    repeat: Joi.string().description('Password plain text string, repeated.')
  }

  cmd_create_verify.validate = {
    mode: Joi.string().description(
      'Verification mode: verify: normal, else hellban.'
    ),
    user: Joi.object({
      email: Joi.string()
    }).description('User details'),
    score: Joi.number().optional(),
    expire: Joi.number().optional()
  }

  // Create a verification entry. Additional user action needed (such as email
  // link confirmation). Also records hell bans.
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
          t_c: d.now(),
          expire: msg.expire || options.verify.expire
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

  /*


      // identify user, various options
      atleastone$: ['nick', 'email', 'user', 'username'],
      nick: { string$: true },
      email: { string$: true },
      username: { string$: true },
      user: { object$: true },

      password: { string$: true }, // password plain text
      auto: { boolean$: true } // login without password
    },
    resolve_user(cmd_login, false)
  )

  

      // identify user, various options
      atleastone$: ['nick', 'email', 'username'],
      nick: { string$: true },
      email: { string$: true },
      username: { string$: true },

      password: { string$: true }, // password plain text string
      repeat: { string$: true }, // password plain text string, repeated

      name: { string$: true }, // full name, as one string
      active: { boolean$: true }, // is user active?

      confirm: { boolean$: true } // is user confirmed?
    },
    cmd_register
  )
  */

  // Encrypt password using a salt and multiple SHA512 rounds
  // Override for password strength checking
  // - password: password string
  // - repeat: password repeat, optional
  // Provides: {pass:,salt:,ok:,why:}
  // use why if password too weak
  function cmd_encrypt_password(args, done) {
    // 128 bits of salt
    var salt = args.salt || create_salt()
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

  // ### Load user based on a query.
  // Required by external seneca plugins such as seneca-auth
  // Pattern: _**sys**:user, **cmd**:load_user_
  // Returns an entity based on a query
  seneca.add(
    {
      sys: 'user',
      get: 'user'
    },
    cmd_load_user
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

  function cmd_load_user(args, done) {
    var q = {}
    if (args.id) q.id = args.id
    if (args.email) q.email = args.email
    if (args.nick) q.nick = args.nick

    seneca.make(user_canon).load$(q, function(err, user) {
      if (err) return done(err)
      return done(null, { ok: true, user: user })
    })
  }

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

          if (_.isBuffer(user.pass)) {
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

  /*
  function hasher(spec, done) {
    var out = spec.src
    var i = 0

    // don't chew up the CPU
    function round() {
      i++
      var shasum = Crypto.createHash('sha512')
      shasum.update(out, 'utf8')
      out = shasum.digest('hex')
      if (spec.rounds <= i) {
        return done(null,out)
      }
      if (0 === i % 88) {
        return process.nextTick(round)
      }
      round()
    }

    round()
  }
  */

  function prepare_password_data(seneca, args, done) {
    var password = void 0 === args.password ? args.pass : args.password
    var repeat = args.repeat

    if (_.isUndefined(password)) {
      if (options.autopass) {
        password = Uuid()
      } else
        return done(null, {
          ok: false,
          code: 'user/no-password',
          whence: args.whence
        })
    }

    if (_.isUndefined(repeat)) {
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

  function create_salt() {
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
    var user = args.user
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
      return make_login(user, 'auto')
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
          } else return make_login(user, 'password')
        }
      )
    }

    function make_login(user, why) {
      var cleanargs = seneca.util.clean(_.clone(args))

      var login = loginent.make$(
        seneca.util.argprops(
          {},
          cleanargs,
          {
            id$: Uuid(),
            nick: user.nick,
            user: user.id,
            when: new Date().toISOString(),
            active: true,
            why: why
          },
          'sys,cmd,password'
        )
      )

      login.token = login.id$ // DEPRECATED

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
}

var intern = (user.intern = {
  conditional_extend: function(options, user, args) {
    var extra = _.omit(args, options.updateUser.omit)
    _.map(extra, function(val, key) {
      if (!key.match(/\$/)) {
        user[key] = val
      }
    })
  }
})
