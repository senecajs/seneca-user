/* Copyright (c) 2026 Richard Rodger and other contributors, MIT License */
'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const Shared = require('./shared')

lab.experiment('sso:login', () => {
  lab.test('registers a new user on first login', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var out = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-001',
      email: 'newbie@example.com',
      email_verified: true,
    })

    expect(out.ok).true()
    expect(out.registered).true()
    expect(out.user.email).equal('newbie@example.com')
    expect(out.login.token).exists()
    expect(out.why).equal('sso:github')

    var link = await si
      .entity('sys/login_provider')
      .load$({ provider: 'github', provider_id: 'gh-001' })
    expect(link).exists()
    expect(link.user_id).equal(out.user.id)
  })

  lab.test('logs in the same user on a repeat login, no duplicate link', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var first = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-002',
      email: 'repeat@example.com',
      email_verified: true,
    })
    expect(first.ok).true()

    var second = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-002',
      email: 'repeat@example.com',
      email_verified: true,
    })

    expect(second.ok).true()
    expect(second.registered).false()
    expect(second.user.id).equal(first.user.id)
    expect(second.login.token).not.equal(first.login.token)

    var links = await si
      .entity('sys/login_provider')
      .list$({ provider: 'github', provider_id: 'gh-002' })
    expect(links.length).equal(1)
  })

  lab.test('links to an existing user via verified email, no new user created', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', {
      handle: 'alice',
      email: 'alice@example.com',
    })
    expect(reg.ok).true()

    var out = await si.post('sys:user,sso:login', {
      provider: 'google',
      provider_id: 'gg-100',
      email: 'alice@example.com',
      email_verified: true,
    })

    expect(out.ok).true()
    expect(out.registered).false()
    expect(out.user.id).equal(reg.user.id)

    var users = await si.entity('sys/user').list$({ email: 'alice@example.com' })
    expect(users.length).equal(1)
  })

  lab.test('refuses to auto-link an unverified email match', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', {
      handle: 'bob',
      email: 'bob@example.com',
    })
    expect(reg.ok).true()

    var out = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-200',
      email: 'bob@example.com',
      email_verified: false,
    })

    expect(out.ok).false()
    expect(out.why).equal('email-exists-unverified')
  })

  lab.test('requires provider and provider_id', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var no_provider = await si.post('sys:user,sso:login', {
      provider_id: 'x',
    })
    expect(no_provider.ok).false()
    expect(no_provider.why).equal('provider-required')

    var no_provider_id = await si.post('sys:user,sso:login', {
      provider: 'github',
    })
    expect(no_provider_id.ok).false()
    expect(no_provider_id.why).equal('provider-id-required')
  })

  lab.test('registers a user with no email at all (e.g. GitHub with no public email)', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var out = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-noemail',
    })

    expect(out.ok).true()
    expect(out.registered).true()
    expect(out.user.email).not.exists()
  })

  lab.test('rejects empty-string provider and provider_id', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var empty_provider = await si.post('sys:user,sso:login', {
      provider: '',
      provider_id: 'x',
    })
    expect(empty_provider.ok).false()
    expect(empty_provider.why).equal('provider-required')

    var empty_provider_id = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: '',
    })
    expect(empty_provider_id.ok).false()
    expect(empty_provider_id.why).equal('provider-id-required')
  })

  lab.test('propagates a not-found error for an orphaned provider link', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    await si
      .entity('sys/login_provider')
      .data$({
        provider: 'github',
        provider_id: 'gh-orphan',
        user_id: 'no-such-user',
      })
      .save$()

    var out = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-orphan',
    })

    expect(out.ok).false()
    expect(out.why).equal('user-not-found')
  })

  lab.test('registers with a name from profile, and passes through login_data', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var out = await si.post('sys:user,sso:login', {
      provider: 'google',
      provider_id: 'gg-profile',
      email: 'profiled@example.com',
      email_verified: true,
      profile: { name: 'Profiled Person' },
      login_data: { ip: '127.0.0.1' },
    })

    expect(out.ok).true()
    expect(out.user.name).equal('Profiled Person')
    expect(out.login.ip).equal('127.0.0.1')
  })

  lab.test('refuses login for an inactive user with an existing link', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var first = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-300',
      email: 'inactive@example.com',
      email_verified: true,
    })
    expect(first.ok).true()

    var deactivated = await si.post('sys:user,adjust:user', {
      id: first.user.id,
      active: false,
    })
    expect(deactivated.ok).true()

    var out = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-300',
      email: 'inactive@example.com',
      email_verified: true,
    })

    expect(out.ok).false()
    expect(out.why).equal('user-not-active')
  })
})

lab.experiment('link:provider / unlink:provider', () => {
  lab.test('link:provider rejects an unknown user_id', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var out = await si.post('sys:user,link:provider', {
      user_id: 'no-such-user',
      provider: 'google',
      provider_id: 'gg-999',
    })

    expect(out.ok).false()
    expect(out.why).equal('user-not-found')
  })

  lab.test('link:provider rejects empty-string provider and provider_id', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', { handle: 'joan', pass: 'secretpass' })

    var empty_provider = await si.post('sys:user,link:provider', {
      user_id: reg.user.id,
      provider: '',
      provider_id: 'x',
    })
    expect(empty_provider.ok).false()
    expect(empty_provider.why).equal('provider-required')

    var empty_provider_id = await si.post('sys:user,link:provider', {
      user_id: reg.user.id,
      provider: 'google',
      provider_id: '',
    })
    expect(empty_provider_id.ok).false()
    expect(empty_provider_id.why).equal('provider-id-required')

    var missing_provider_id = await si.post('sys:user,link:provider', {
      user_id: reg.user.id,
      provider: 'google',
    })
    expect(missing_provider_id.ok).false()
    expect(missing_provider_id.why).equal('provider-id-required')
  })

  lab.test('unlink:provider rejects an unknown user_id', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var out = await si.post('sys:user,unlink:provider', {
      user_id: 'no-such-user',
      provider: 'google',
    })

    expect(out.ok).false()
    expect(out.why).equal('user-not-found')
  })

  lab.test('unlink:provider rejects an empty-string provider', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', { handle: 'kate', pass: 'secretpass' })

    var out = await si.post('sys:user,unlink:provider', {
      user_id: reg.user.id,
      provider: '',
    })
    expect(out.ok).false()
    expect(out.why).equal('provider-required')
  })

  lab.test('links a new provider to an existing user', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', {
      handle: 'carol',
      pass: 'secretpass',
    })
    expect(reg.ok).true()

    var out = await si.post('sys:user,link:provider', {
      user_id: reg.user.id,
      provider: 'google',
      provider_id: 'gg-500',
      email: 'carol@example.com',
      email_verified: true,
    })

    expect(out.ok).true()
    expect(out.already_linked).not.exists()
  })

  lab.test('linking the same provider twice for the same user is idempotent', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', {
      handle: 'dave',
      pass: 'secretpass',
    })

    var link_data = {
      user_id: reg.user.id,
      provider: 'google',
      provider_id: 'gg-501',
    }

    var first = await si.post('sys:user,link:provider', link_data)
    expect(first.ok).true()

    var second = await si.post('sys:user,link:provider', link_data)
    expect(second.ok).true()
    expect(second.already_linked).true()
  })

  lab.test('refuses to link a provider identity already linked to another user', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var owner = await si.post('sys:user,register:user', {
      handle: 'erin',
      pass: 'secretpass',
    })
    var other = await si.post('sys:user,register:user', {
      handle: 'frank',
      pass: 'secretpass',
    })

    var linked = await si.post('sys:user,link:provider', {
      user_id: owner.user.id,
      provider: 'github',
      provider_id: 'gh-600',
    })
    expect(linked.ok).true()

    var conflict = await si.post('sys:user,link:provider', {
      user_id: other.user.id,
      provider: 'github',
      provider_id: 'gh-600',
    })

    expect(conflict.ok).false()
    expect(conflict.why).equal('provider-already-linked')
  })

  lab.test('unlinks a provider when the user still has a password', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', {
      handle: 'gina',
      pass: 'secretpass',
    })

    await si.post('sys:user,link:provider', {
      user_id: reg.user.id,
      provider: 'github',
      provider_id: 'gh-700',
    })

    var out = await si.post('sys:user,unlink:provider', {
      user_id: reg.user.id,
      provider: 'github',
    })

    expect(out.ok).true()

    var link = await si
      .entity('sys/login_provider')
      .load$({ provider: 'github', provider_id: 'gh-700' })
    expect(link).not.exists()
  })

  lab.test('refuses to unlink the last auth method', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    // No password set - sso-only account.
    var sso = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-800',
      email: 'ssoonly@example.com',
      email_verified: true,
    })
    expect(sso.ok).true()

    var out = await si.post('sys:user,unlink:provider', {
      user_id: sso.user.id,
      provider: 'github',
    })

    expect(out.ok).false()
    expect(out.why).equal('last-auth-method')
  })

  lab.test('allows unlinking one of two linked providers with no password', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var sso = await si.post('sys:user,sso:login', {
      provider: 'github',
      provider_id: 'gh-900',
      email: 'twoprovider@example.com',
      email_verified: true,
    })
    expect(sso.ok).true()

    await si.post('sys:user,link:provider', {
      user_id: sso.user.id,
      provider: 'google',
      provider_id: 'gg-900',
    })

    var out = await si.post('sys:user,unlink:provider', {
      user_id: sso.user.id,
      provider: 'github',
    })

    expect(out.ok).true()
  })

  lab.test('returns not-linked when there is nothing to unlink', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', {
      handle: 'hank',
      pass: 'secretpass',
    })

    var out = await si.post('sys:user,unlink:provider', {
      user_id: reg.user.id,
      provider: 'github',
    })

    expect(out.ok).false()
    expect(out.why).equal('provider-not-linked')
  })

  lab.test('requires provider on both link and unlink', async () => {
    var si = Shared.make_seneca()
    await si.ready()

    var reg = await si.post('sys:user,register:user', {
      handle: 'ivan',
      pass: 'secretpass',
    })

    var link_out = await si.post('sys:user,link:provider', {
      user_id: reg.user.id,
      provider_id: 'gh-999',
    })
    expect(link_out.ok).false()
    expect(link_out.why).equal('provider-required')

    var unlink_out = await si.post('sys:user,unlink:provider', {
      user_id: reg.user.id,
    })
    expect(unlink_out.ok).false()
    expect(unlink_out.why).equal('provider-required')
  })
})
