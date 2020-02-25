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
const Joi = require('@hapi/joi')

module.exports = user

module.exports.errors = {}

const intern = (module.exports.intern = make_intern())

module.exports.defaults = {
  test: false,

  salt: {
    bytelen: 16,
    format: 'hex'
  },

  rounds: 11111,

  fields: {
    standard: ['handle', 'email', 'name', 'active']
  },

  onetime: {
    expire: 15 * 60 * 1000 // 15 minutes
  },

  password: {
    minlen: 8
  },

  handle: {
    minlen: 3,
    maxlen: 15,
    reserved: ['guest', 'visitor'],
    must_match: handle => handle.match(/^[a-z0-9_]+$/),

    // a function returning an array of strings
    must_not_contain: Nid.curses,

    downcase: true
  },

  limit: 111, // default result limit

  ensure_handle: intern.ensure_handle,
  make_handle: intern.make_handle,
  make_token: intern.make_token

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
    .message('list:user', intern.make_msg('list_user', ctx))
    .message('adjust:user', intern.make_msg('adjust_user', ctx))
    .message('update:user', intern.make_msg('update_user', ctx))
    .message('remove:user', intern.make_msg('remove_user', ctx))
    .message('login:user', intern.make_msg('login_user', ctx))
    .message('logout:user', intern.make_msg('logout_user', ctx))

    .message('list:login', intern.make_msg('list_login', ctx))

    .message('make:verify', intern.make_msg('make_verify', ctx))
    .message('list:verify', intern.make_msg('list_verify', ctx))

    .message('change:pass', intern.make_msg('change_pass', ctx))
    .message('change:handle', intern.make_msg('change_handle', ctx))
    .message('change:email', intern.make_msg('change_email', ctx))

    .message('check:verify', intern.make_msg('check_verify', ctx))
    .message('check:exists', intern.make_msg('check_exists', ctx))

    .message('auth:user', intern.make_msg('auth_user', ctx))

    .message('hook:password,cmd:encrypt', intern.make_msg('cmd_encrypt', ctx))
    .message('hook:password,cmd:pass', intern.make_msg('cmd_pass', ctx))

    // TODO: seneca.alias method?
    .message('change:password', intern.make_msg('change_pass', ctx))

  // NEXT
  // JOI VALIDATE EXISTING

  //.message('remove:user'
  //.message('migrate:data' - use native mongo driver to do update nick->handle

  return {
    exports: {
      find_user: async function(seneca, msg, special_ctx) {
        var merged_ctx =
          null == special_ctx ? ctx : seneca.util.deep({}, ctx, special_ctx)
        return intern.find_user(seneca, msg, merged_ctx)
      }
    }
  }

  // --- LEGACY BELOW ---
  /*


  // LEGACY IMPLEMENTATIONS BELOW






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
    SV: 1, // semantic version, used for data migration

    make_msg: function(msg_fn, ctx) {
      return require('./lib/' + msg_fn)(ctx)
    },

    make_ctx: function(initial_ctx, options) {
      Assert(initial_ctx)
      Assert(options)

      // convert arrays to lookup maps
      var handle = { reserved: {} }

      for (var i = 0; i < options.handle.reserved.length; i++) {
        handle.reserved[options.handle.reserved[i]] = true
      }

      var must_not_contain_array = options.handle.must_not_contain()
      var must_not_contain_map = {}
      for (i = 0; i < must_not_contain_array.length; i++) {
        must_not_contain_map[must_not_contain_array[i]] = true
      }
      handle.must_not_contain = () => must_not_contain_map

      return Object.assign(
        {
          intern,
          options,

          // Standard entity canons
          sys_user: 'sys/user',
          sys_login: 'sys/login',
          sys_verify: 'sys/verify',

          // Standard user fields to load - keep data volume low by default
          standard_user_fields: options.fields.standard,

          // Convenience query fields - msg.email etc.
          convenience_fields: 'id,user_id,handle,email,name'.split(','),

          handle
        },
        initial_ctx
      )
    },

    user_exists: async function(seneca, msg, ctx) {
      ctx.fields = []
      var found = await intern.find_user(seneca, msg, ctx)
      return found.ok
    },

    find_user: async function(seneca, msg, ctx) {
      // User may already be provided in parameters.
      var user = msg.user && msg.user.entity$ ? msg.user : null

      // user_q when q used for caller's query
      var msg_user_query = msg.user_q || msg.q || {}

      if (null == user) {
        msg = intern.fix_nick_handle(msg, ctx.options)

        var why = null

        // allow use of `q` (or `user_q`) to specify query,
        // or `user` prop (q has precedence)
        var q = Object.assign(
          {},
          msg.user || {},
          msg.user_data || {},
          msg_user_query
        )

        // can only use one convenience field - they are ordered by decreasing
        // precedence
        for (var cfI = 0; cfI < ctx.convenience_fields.length; cfI++) {
          var f = ctx.convenience_fields[cfI]
          if (null != msg[f]) {
            q[f] = msg[f]
            break
          }
        }

        // `user_id` is an alias for `id`
        if (null == q.id && null != q.user_id) {
          q.id = q.user_id
        }
        delete q.user_id

        // TODO: waiting for fix: https://github.com/senecajs/seneca-entity/issues/57

        if (0 < Object.keys(seneca.util.clean(q)).length) {
          // Add additional fields to standard fields.
          var fields = Array.isArray(msg.fields) ? msg.fields : []
          q.fields$ = [
            ...new Set((q.fields$ || fields).concat(ctx.standard_user_fields))
          ]

          // These are the unique fields
          if (null == q.id && null == q.handle && null == q.email) {
            var users = await seneca.entity(ctx.sys_user).list$(q)

            if (1 === users.length) {
              user = intern.fix_nick_handle(users[0], ctx.options)
            } else if (1 < users.length) {
              // This is bad, as you could operate on another user
              why = 'multiple-matching-users'
            }
          } else {
            // Use load$ to trigger entity cache
            user = await seneca.entity(ctx.sys_user).load$(q)
          }
        } else {
          why = 'no-user-query'
        }
      }

      var out = { ok: null != user, user: user || null }
      if (null == user) {
        out.why = why || 'user-not-found'
      }

      return out
    },

    build_pass_fields: async function(seneca, msg, ctx) {
      var pass = null != msg.pass ? msg.pass : msg.password
      var repeat = msg.repeat // optional
      var salt = msg.salt

      if ('string' === typeof repeat && repeat !== pass) {
        return { ok: false, why: 'repeat-password-mismatch' }
      }

      var res = await seneca.post('sys:user,hook:password,cmd:encrypt', {
        pass: pass,
        salt: salt
      })

      if (res.ok) {
        return {
          ok: true,
          fields: {
            pass: res.pass,
            salt: res.salt
          }
        }
      } else {
        return {
          ok: false,
          why: res.why,

          /* $lab:coverage:off$ */
          details: res.details || {}
          /* $lab:coverage:on$ */
        }
      }
    },

    generate_salt: function(options) {
      return Crypto.randomBytes(options.salt.bytelen).toString(
        options.salt.format
      )
    },

    // Automate migration of nick->handle. Removes nick.
    // Assume update value will be saved elsewhere in due course.
    fix_nick_handle: function(data, options) {
      Assert(options)

      if (null == data) {
        return data
      }

      var downcase = options.handle.downcase

      if (null != data.nick) {
        data.handle = null != data.handle ? data.handle : data.nick
        data.handle = downcase ? data.handle.toLowerCase() : data.handle
        delete data.nick
      }

      if (null != data.user && null != data.user.nick) {
        data.user.handle =
          null != data.user.handle ? data.user.handle : data.user.nick
        data.user.handle = downcase
          ? data.user.handle.toLowerCase()
          : data.user.handle
        delete data.user.nick
      }

      if (null != data.user_data && null != data.user_data.nick) {
        data.user_data.handle =
          null != data.user_data.handle
            ? data.user_data.handle
            : data.user_data.nick
        data.user_data.handle = downcase
          ? data.user_data.handle.toLowerCase()
          : data.user_data.handle
        delete data.user_data.nick
      }

      if (null != data.q && null != data.q.nick) {
        data.q.handle = null != data.q.handle ? data.q.handle : data.q.nick
        data.q.handle = downcase ? data.q.handle.toLowerCase() : data.q.handle
        delete data.q.nick
      }

      return data
    },

    // NOTE: modifies msg if needed to ensure consistency
    ensure_handle: function(msg, options) {
      var user_data = msg.user_data || msg.user || {}
      var handle = null == msg.handle ? user_data.handle : msg.handle

      if ('string' != typeof handle) {
        var email = msg.email || user_data.email || null

        // NOTE: assumes email already validated in msg
        if (null != email) {
          handle =
            email.split('@')[0].toLowerCase() +
            ('' + Math.random()).substring(2, 6)
        } else {
          handle = options.make_handle()
        }
      }

      handle = handle.substring(0, options.handle.maxlen)

      if (options.handle.downcase) {
        handle = handle.toLowerCase()
      }

      msg.handle = handle
      user_data.handle = handle

      return handle
    },

    make_handle: Nid({ length: '12', alphabet: 'abcdefghijklmnopqrstuvwxyz' }),

    make_token: Uuid.v4, // Random! Don't leak things.

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
        why: why,

        sv: intern.SV
      }

      if (onetime) {
        full_login_data.onetime_active = true
        ;(full_login_data.onetime_token = options.make_token()),
          (full_login_data.onetime_expiry = Date.now() + options.onetime.expire)
      }

      var login = await seneca
        .entity(ctx.sys_login)
        .data$(full_login_data)
        .save$()

      return login
    },

    load_user_fields: function(msg, ...rest) {
      /* $lab:coverage:off$ */
      // Seventh Circle of Hell, aka node < 12
      rest.flat =
        'function' == typeof rest.flat
          ? rest.flat
          : function() {
              return this.reduce((a, y) => {
                return Array.isArray(y) ? a.concat(y) : (a.push(y), a)
              }, [])
            }.bind(rest)
      /* $lab:coverage:on$ */

      var fields = rest
        .flat()
        .filter(f => 'string' === typeof f && 0 < f.length)
      msg.q = msg.q || {}
      msg.q.fields$ = msg.q.fields$ || []
      msg.q.fields$ = msg.q.fields$.concat(fields)
      msg.q.fields$ = [...new Set(msg.q.fields$)] // remove dups
      return msg
    },

    email_schema: Joi.string()
      .email()
      .required(),

    valid_email: async function(seneca, email, ctx) {
      var email_valid = intern.email_schema.validate(email)
      if (email_valid.error) {
        return { ok: false, email: email, why: 'email-invalid-format' }
      }

      var email_taken = await intern.find_user(seneca, { email: email }, ctx)

      return {
        ok: !email_taken.ok,
        email: email,
        why: email_taken.ok ? 'email-exists' : null
      }
    },

    valid_handle: async function(seneca, handle, ctx) {
      var options = ctx.options

      if ('string' != typeof handle) {
        return { ok: false, why: 'not-string', details: { handle: handle } }
      }

      handle = options.handle.downcase ? handle.toLowerCase() : handle

      if (ctx.handle.reserved[handle]) {
        return { ok: false, why: 'reserved', details: { handle: handle } }
      }

      var mnc = ctx.handle.must_not_contain()
      if (mnc[handle]) {
        return {
          ok: false,
          why: 'disallowed',
          details: { handle_base64: Buffer.from(handle).toString('base64') }
        }
      }

      if (!options.handle.must_match(handle)) {
        return { ok: false, why: 'invalid-chars', details: { handle: handle } }
      }

      if (handle.length < options.handle.minlen) {
        return {
          ok: false,
          why: 'handle-too-short',
          details: {
            handle: handle,
            handle_length: handle.length,
            minimum: options.handle.minlen
          }
        }
      }

      if (options.handle.maxlen < handle.length) {
        return {
          ok: false,
          why: 'handle-too-long',
          details: {
            handle: handle,
            handle_length: handle.length,
            maximum: options.handle.maxlen
          }
        }
      }

      var exists = await intern.user_exists(seneca, { handle: handle }, ctx)

      if (exists) {
        return {
          ok: false,
          why: 'handle-exists',
          details: { handle: handle }
        }
      }

      return { ok: true, handle: handle }
    },

    // These variations are supported for better REPL DX
    extract_pass: function(msg) {
      var pass_data = {}
      if ('string' === typeof msg.pass || 'string' === typeof msg.password) {
        pass_data.pass = msg.pass || msg.password
        pass_data.repeat = msg.repeat
      } else if (
        msg.user &&
        ('string' === typeof msg.user.pass ||
          'string' === typeof msg.user.password)
      ) {
        pass_data.pass = msg.user.pass || msg.user.password
        pass_data.repeat = msg.user.repeat
      } else if (
        msg.user_data &&
        ('string' === typeof msg.user_data.pass ||
          'string' === typeof msg.user_data.password)
      ) {
        pass_data.pass = msg.user_data.pass || msg.user_data.password
        pass_data.repeat = msg.user_data.repeat
      }
      return pass_data
    }
  }
}
