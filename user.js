/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

const Assert = require('assert')

const Crypto = require('crypto')
const Nid = require('nid')
const Uuid = require('uuid')
const Joi = require('@hapi/joi')

// TODO: test03



module.exports = user

module.exports.errors = {}

const intern = (module.exports.intern = make_intern())

module.exports.defaults = {
  test: false,

  salt: {
    bytelen: 16,
    format: 'hex',
  },

  pepper: '',

  rounds: 11111,

  fields: {
    standard: ['handle', 'email', 'name', 'active'],
  },

  onetime: {
    expire: 15 * 60 * 1000, // 15 minutes
  },

  password: {
    minlen: 8,
  },

  handle: {
    minlen: 3,
    maxlen: 15,
    reserved: ['guest', 'visitor'],
    must_match: (handle) => handle.match(/^[a-z0-9_]+$/),

    // a function returning an array of strings
    must_not_contain: Nid.curses,

    sanitize: (handle) => handle.replace(/[^a-z0-9_]/g, '_'),

    downcase: true,
  },

  limit: 111, // default result limit

  generate_salt: intern.generate_salt,
  ensure_handle: intern.ensure_handle,
  make_handle: intern.make_handle,
  make_token: intern.make_token,
}

function user(options) {
  var seneca = this
  var ctx = intern.make_ctx({}, options)

  // TODO @seneca/audit - record user modifications - e.g activate
  // TODO @seneca/microcache - short duration cache of msg responses

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

    .message('check:handle', intern.make_msg('check_handle', ctx))
    .message('check:verify', intern.make_msg('check_verify', ctx))
    .message('check:exists', intern.make_msg('check_exists', ctx))

    .message('auth:user', intern.make_msg('auth_user', ctx))

    .message('hook:password,cmd:encrypt', intern.make_msg('cmd_encrypt', ctx))
    .message('hook:password,cmd:pass', intern.make_msg('cmd_pass', ctx))

    // TODO seneca.alias method?
    .message('change:password', intern.make_msg('change_pass', ctx))

  return {
    exports: {
      find_user: async function (seneca, msg, special_ctx) {
        var merged_ctx =
          null == special_ctx ? ctx : seneca.util.deep({}, ctx, special_ctx)
        return intern.find_user(seneca, msg, merged_ctx)
      },
    },
  }
}

function make_intern() {
  return {
    SV: 1, // semantic version, used for data migration

    make_msg: function (msg_fn, ctx) {
      return require('./lib/' + msg_fn)(ctx)
    },

    make_ctx: function (initial_ctx, options) {
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
          options,
          intern,

          // Standard entity canons
          sys_user: 'sys/user',
          sys_login: 'sys/login',
          sys_verify: 'sys/verify',

          // Standard user fields to load - keep data volume low by default
          standard_user_fields: options.fields.standard,

          // Convenience query fields - msg.email etc.
          convenience_fields: 'id,user_id,handle,email,name'.split(','),

          handle,
        },
        initial_ctx
      )
    },

    user_exists: async function (seneca, msg, ctx) {
      ctx.fields = []
      var found = await intern.find_user(seneca, msg, ctx)
      return found.ok
    },

    find_user: async function (seneca, msg, ctx) {
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

        // TODO waiting for fix: https://github.com/senecajs/seneca-entity/issues/57

        if (0 < Object.keys(seneca.util.clean(q)).length) {
          // Add additional fields to standard fields.
          var fields = Array.isArray(msg.fields) ? msg.fields : []
          q.fields$ = [
            ...new Set((q.fields$ || fields).concat(ctx.standard_user_fields)),
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

    // expects normalized user data
    build_pass_fields: async function (seneca, user_data, ctx) {
      var pass = user_data.pass
      var repeat = user_data.repeat // optional
      var salt = user_data.salt

      if ('string' === typeof repeat && repeat !== pass) {
        return { ok: false, why: 'repeat-password-mismatch' }
      }

      var res = await seneca.post('sys:user,hook:password,cmd:encrypt', {
        pass: pass,
        salt: salt,
        whence: 'build',
      })

      if (res.ok) {
        return {
          ok: true,
          fields: {
            pass: res.pass,
            salt: res.salt,
          },
        }
      } else {
        return {
          ok: false,
          why: res.why,

          /* $lab:coverage:off$ */
          details: res.details || {},
          /* $lab:coverage:on$ */
        }
      }
    },

    generate_salt: function (options) {
      return Crypto.randomBytes(options.salt.bytelen).toString(
        options.salt.format
      )
    },

    // Automate migration of nick->handle. Removes nick.
    // Assume update value will be saved elsewhere in due course.
    fix_nick_handle: function (data, options) {
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

    // expects normalized user data
    ensure_handle: function (user_data, options) {
      var handle = user_data.handle

      if ('string' != typeof handle) {
        var email = user_data.email

        // NOTE: assumes email already validated in user_data
        if (null != email) {
          handle =
            email.split('@')[0].toLowerCase() +
            ('' + Math.random()).substring(2, 6)

          handle = options.handle
            .sanitize(handle)
            .substring(0, options.handle.maxlen)
        } else {
          handle = options.make_handle()
        }
      }

      handle = handle.substring(0, options.handle.maxlen)

      if (options.handle.downcase) {
        handle = handle.toLowerCase()
      }

      return handle
    },

    make_handle: Nid({ length: '12', alphabet: 'abcdefghijklmnopqrstuvwxyz' }),

    make_token: Uuid.v4, // Random! Don't leak things.

    make_login: async function (spec) {
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

        sv: intern.SV,
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

    load_user_fields: function (msg, ...rest) {
      /* $lab:coverage:off$ */
      // Seventh Circle of Hell, aka node < 12
      rest.flat =
        'function' == typeof rest.flat
          ? rest.flat
          : function () {
              return this.reduce((a, y) => {
                return Array.isArray(y) ? a.concat(y) : (a.push(y), a)
              }, [])
            }.bind(rest)
      /* $lab:coverage:on$ */

      var fields = rest
        .flat()
        .filter((f) => 'string' === typeof f && 0 < f.length)
      msg.q = msg.q || {}
      msg.q.fields$ = msg.q.fields$ || []
      msg.q.fields$ = msg.q.fields$.concat(fields)
      msg.q.fields$ = [...new Set(msg.q.fields$)] // remove dups
      return msg
    },

    email_schema: Joi.string().email().required(),

    valid_email: async function (seneca, email, ctx) {
      var email_valid = intern.email_schema.validate(email)
      if (email_valid.error) {
        return { ok: false, email: email, why: 'email-invalid-format' }
      }

      var email_taken = await intern.find_user(seneca, { email: email }, ctx)

      return {
        ok: !email_taken.ok,
        email: email,
        why: email_taken.ok ? 'email-exists' : null,
      }
    },

    valid_handle: async function (seneca, handle, ctx) {
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
          details: { handle_base64: Buffer.from(handle).toString('base64') },
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
            minimum: options.handle.minlen,
          },
        }
      }

      if (options.handle.maxlen < handle.length) {
        return {
          ok: false,
          why: 'handle-too-long',
          details: {
            handle: handle,
            handle_length: handle.length,
            maximum: options.handle.maxlen,
          },
        }
      }

      var exists = await intern.user_exists(seneca, { handle: handle }, ctx)

      if (exists) {
        return {
          ok: false,
          why: 'handle-exists',
          details: { handle: handle },
        }
      }

      return { ok: true, handle: handle }
    },

    normalize_user_data: function (msg, ctx) {
      msg = intern.fix_nick_handle(msg, ctx.options)

      var msg_user = msg.user || {}
      var msg_user_data = msg.user_data || {}

      var top_data = {}
      var top_fields = ctx.convenience_fields.concat([
        'pass',
        'password',
        'repeat',
      ])
      top_fields.forEach((f) => null == msg[f] || (top_data[f] = msg[f]))

      var user_data = Object.assign({}, msg_user, msg_user_data, top_data)

      // password -> pass
      if (null != user_data.password) {
        user_data.pass = user_data.pass || user_data.password
        delete user_data.password
      }

      // strip undefineds
      Object.keys(user_data).forEach(
        (k) => void 0 === user_data[k] && delete user_data[k]
      )

      return user_data
    },
  }
}
