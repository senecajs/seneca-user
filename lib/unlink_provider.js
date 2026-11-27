/* Copyright (c) 2012-2026 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern

  // Remove a linked external identity. Refuses to remove the user's last
  // remaining auth method (no password set, no other linked providers) so
  // the account can never become permanently inaccessible.
  return async function unlink_provider(msg) {
    var seneca = this

    var user_id = msg.user_id
    var provider = msg.provider

    if ('string' !== typeof provider || 0 === provider.length) {
      return { ok: false, why: 'provider-required' }
    }

    var found = await intern.find_user(
      seneca,
      { id: user_id, fields: ['pass'] },
      ctx,
    )

    if (!found.ok) {
      return found
    }

    var link = await seneca
      .entity(ctx.sys_login_provider)
      .load$({ provider: provider, user_id: user_id })

    if (null == link) {
      return {
        ok: false,
        why: 'provider-not-linked',
        details: { provider: provider },
      }
    }

    var has_pass = 'string' === typeof found.user.pass

    if (!has_pass) {
      var other_links = await seneca
        .entity(ctx.sys_login_provider)
        .list$({ user_id: user_id })

      var other_provider_links = other_links.filter((l) => l.provider !== provider)

      if (0 === other_provider_links.length) {
        return {
          ok: false,
          why: 'last-auth-method',
          details: { provider: provider },
        }
      }
    }

    await link.remove$()

    return { ok: true, user_id: user_id, provider: provider }
  }
}
