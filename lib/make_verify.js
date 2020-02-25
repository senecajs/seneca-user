/* Copyright (c) 2012-2020 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = ctx => {
  const intern = ctx.intern
  // const options = ctx.options

  return async function make_verify(msg) {
    var seneca = this

    var found = await intern.find_user(this, msg, ctx)

    if (!found.ok) {
      return found
    }

    var kind = msg.kind
    var code = msg.code || intern.make_token()
    var once = null == msg.once ? true : !!msg.once
    var valid = null == msg.valid ? false : !!msg.valid
    var unique = null == msg.unique ? true : !!msg.unique

    var custom = msg.custom || {}

    // convenience field for `kind`
    if (null != msg[kind]) {
      custom[kind] = msg[kind]
    }

    var now_date = new Date()
    var t_c = now_date.getTime()
    var t_c_s = now_date.toISOString()
    var t_m = t_c
    var t_m_s = t_c_s

    var t_expiry =
      null != msg.expire_point
        ? msg.expire_point
        : null != msg.expire_duration
        ? t_c + msg.expire_duration
        : Number.MAX_SAFE_INTEGER

    var verify_data = {
      ...custom,
      user_id: found.user.id,
      kind: kind,
      code: code,
      once: once,
      used: false,
      valid: valid,
      t_expiry: t_expiry,
      t_c: t_c,
      t_c_s: t_c_s,
      t_m: t_m,
      t_m_s: t_m_s,
      sv: intern.SV
    }

    if (unique) {
      var unique_query = {
        user_id: found.user.id,
        kind: kind
      }

      if (null == custom[kind]) {
        unique_query.code = code
      } else {
        unique_query[kind] = custom[kind]
      }

      var existing_verify = await seneca
        .entity(ctx.sys_verify)
        .load$(unique_query)

      if (existing_verify) {
        return {
          ok: false,
          why: 'not-unique',
          details: {
            query: unique_query
          }
        }
      }
    }

    var verify = await seneca
      .entity(ctx.sys_verify)
      .data$(verify_data)
      .save$()

    return { ok: true, verify: verify }
  }
}

/* 

ABBREVIATED SYNTAX FOR ABOVE

TRANSLATE TO LISP TO EVALUATE?

whitespace is not significant

$msg - inbound
! - send response
& - last msg sent
% - last response
$x - name something via =
?: - conditional
# define pattern
; - end response matching, optional, to pop response matching stack
$ - current msg
~ match
// comment

$save = sys:entity,cmd:save,canon:sys/verify

# sys:user,make:verify,
  kind ~ string,
  code ~ string | "make_token()",
  once ~ bool | true,
  valid ~ bool | false,
  unique ~ bool | true,
  custom ~ object | {},

> sys:user, find:user, q:$msg
< ok:false !%

< ok:true, user~object $user = %.user

// auto fail if no matching response, or pass through if '<' alone

? $msg.unique
  > sys:entity,
    cmd:load,
    canon:sys/verify,
    q: {
      user_id: $user.id,
      kind: $msg.kind,
      $msg.kind: $msg[$msg.kind] | code:$msg.code
    }
  < exists ! ok:false, why:not-unique, details:{query:&.q}
  ;

$now = "new Date()"

> $save, ent: {
    $msg.custom,
    user_id: $user.id,
    kind: $msg.kind,
    code: $msg.code,
    once: $msg.once,
    valid: $msg.valid | false,
    t_expiry: $msg.expire_point |
      (? $msg.expire_duration "$.t_c+$msg.expire_duration" :
        "Number.MAX_SAFE_INTEGER")
    t_c: "$now.getTime()",
    t_c_s: "$now.toISOString()",
    t_m: $.t_c,
    t_m_s: $.t_c_s,

  }
< ! {ok:true, verify:%}


*/
