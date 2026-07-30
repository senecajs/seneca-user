/* Copyright (c) 2012-2026 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern

  // Attach an external identity (Google/GitHub/Apple) to an already-known
  // user - e.g. "connect GitHub" from account settings, where the caller
  // has already established which user_id this is (via a normal password
  // session, or another provider) rather than logging in.
  return async function link_provider(msg) {
    var seneca = this

    var user_id = msg.user_id
    var provider = msg.provider
    var provider_id = msg.provider_id
    var email = msg.email || null
    var email_verified = !!msg.email_verified

    if ('string' !== typeof provider || 0 === provider.length) {
      return { ok: false, why: 'provider-required' }
    }

    if ('string' !== typeof provider_id || 0 === provider_id.length) {
      return { ok: false, why: 'provider-id-required' }
    }

    var found = await intern.find_user(seneca, { id: user_id }, ctx)

    if (!found.ok) {
      return found
    }

    var existing = await seneca
      .entity(ctx.sys_login_provider)
      .load$({ provider: provider, provider_id: provider_id })

    if (null != existing) {
      if (existing.user_id !== user_id) {
        return {
          ok: false,
          why: 'provider-already-linked',
          details: { provider: provider },
        }
      }

      // Idempotent - already linked to this same user.
      return { ok: true, user_id: user_id, provider: provider, already_linked: true }
    }

    await seneca
      .entity(ctx.sys_login_provider)
      .data$({
        provider: provider,
        provider_id: provider_id,
        user_id: user_id,
        email: email,
        email_verified: email_verified,
        when: new Date().toISOString(),
      })
      .save$()

    return { ok: true, user_id: user_id, provider: provider }
  }
}
