/* Copyright (c) 2026 Richard Rodger and other contributors, MIT License */
'use strict'

var print_calls = false

const LN = require('seneca-msg-test').LN

// NOTE: appended after final.calls.js so its side effects (new users) do
// not disturb final.calls.js's exact list:user assertions.

module.exports = [
  {
    name: 'sso0',
    print: print_calls,
    pattern: 'sso:login' + LN(),
    params: {
      provider: 'github',
      provider_id: 'msgtest-gh-1',
      email: 'msgtest@example.com',
      email_verified: true,
    },
    out: {
      ok: true,
      registered: true,
      why: 'sso:github',
    },
  },

  // repeat login with the same provider identity -> same user, no re-registration
  {
    print: print_calls,
    pattern: 'sso:login' + LN(),
    params: {
      provider: 'github',
      provider_id: 'msgtest-gh-1',
      email: 'msgtest@example.com',
      email_verified: true,
    },
    out: {
      ok: true,
      registered: false,
      user: { id: '`sso0:out.user.id`' },
    },
  },

  {
    print: print_calls,
    pattern: 'sso:login' + LN(),
    params: {
      provider: 'github',
    },
    out: {
      ok: false,
      why: 'provider-id-required',
    },
  },

  {
    print: print_calls,
    pattern: 'link:provider' + LN(),
    params: {
      user_id: '`sso0:out.user.id`',
      provider: 'google',
      provider_id: 'msgtest-gg-1',
    },
    out: {
      ok: true,
      provider: 'google',
    },
  },

  // idempotent re-link
  {
    print: print_calls,
    pattern: 'link:provider' + LN(),
    params: {
      user_id: '`sso0:out.user.id`',
      provider: 'google',
      provider_id: 'msgtest-gg-1',
    },
    out: {
      ok: true,
      already_linked: true,
    },
  },

  // unlinking github is fine - google link remains as an auth method
  {
    print: print_calls,
    pattern: 'unlink:provider' + LN(),
    params: {
      user_id: '`sso0:out.user.id`',
      provider: 'github',
    },
    out: {
      ok: true,
      provider: 'github',
    },
  },

  // unlinking google now would leave no auth method at all - refused
  {
    print: print_calls,
    pattern: 'unlink:provider' + LN(),
    params: {
      user_id: '`sso0:out.user.id`',
      provider: 'google',
    },
    out: {
      ok: false,
      why: 'last-auth-method',
    },
  },
]
