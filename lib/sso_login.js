/* Copyright (c) 2012-2026 Richard Rodger and other contributors, MIT License. */
'use strict'

module.exports = (ctx) => {
  const intern = ctx.intern

  // Federated login: given an identity already verified by an external
  // provider (Google/GitHub/Apple - verification happens upstream, in the
  // OAuth transport plugin, never here), find-or-create the local user and
  // issue a session the same way login_user.js does.
  return async function sso_login(msg) {
    var seneca = this

    var provider = msg.provider
    var provider_id = msg.provider_id
    var email = msg.email || null
    var email_verified = !!msg.email_verified
    var login_data = msg.login_data || {}

    if ('string' !== typeof provider || 0 === provider.length) {
      return { ok: false, why: 'provider-required' }
    }

    if ('string' !== typeof provider_id || 0 === provider_id.length) {
      return { ok: false, why: 'provider-id-required' }
    }

    var link = await seneca
      .entity(ctx.sys_login_provider)
      .load$({ provider: provider, provider_id: provider_id })

    var user = null
    var why = null
    var registered = false

    if (null != link) {
      var found = await intern.find_user(seneca, { id: link.user_id }, ctx)

      if (!found.ok) {
        return found
      }

      user = found.user

      if (!user.active) {
        return { ok: false, user_id: user.id, why: 'user-not-active' }
      }

      // Keep the stored provider email fresh (best-effort, non-fatal).
      await link.data$({ email: email, email_verified: email_verified }).save$()

      why = 'sso:' + provider
    } else if (null != email) {
      var existing = await intern.find_user(seneca, { email: email }, ctx)

      if (existing.ok) {
        if (!email_verified) {
          return {
            ok: false,
            why: 'email-exists-unverified',
            details: { email: email },
          }
        }

        user = existing.user

        await seneca
          .entity(ctx.sys_login_provider)
          .data$({
            provider: provider,
            provider_id: provider_id,
            user_id: user.id,
            email: email,
            email_verified: email_verified,
            when: new Date().toISOString(),
          })
          .save$()

        why = 'sso:' + provider
      }
      // NOTE: existing.why can never be 'multiple-matching-users' here -
      // find_user only takes that path when the query has no id/handle/email,
      // and we always query by email.
    }

    // No existing link, and no (or no matching) verified email - register.
    if (null == user) {
      var reg = await seneca.post('sys:user,register:user', {
        email: email || undefined,
        name: msg.profile && msg.profile.name,
      })

      /* $lab:coverage:off$ */
      // Defensive: by this point we've already ruled out an email
      // conflict ourselves (see the find_user check above), so
      // register:user cannot fail here in practice.
      if (!reg.ok) {
        return reg
      }
      /* $lab:coverage:on$ */

      user = reg.user
      registered = true

      await seneca
        .entity(ctx.sys_login_provider)
        .data$({
          provider: provider,
          provider_id: provider_id,
          user_id: user.id,
          email: email,
          email_verified: email_verified,
          when: new Date().toISOString(),
        })
        .save$()

      why = 'sso:' + provider
    }

    var login = await intern.make_login({
      why: why,
      user: user,
      seneca: seneca,
      ctx: ctx,
      login_data: login_data,
    })

    return { ok: true, user: user, login: login, why: why, registered: registered }
  }
}
