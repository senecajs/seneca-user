![Seneca](http://senecajs.org/files/assets/seneca-logo.png)

> A [Seneca.js][] user management plugin.

# @seneca/user

[![npm version][npm-badge]][npm-url]
[![build](https://github.com/senecajs/seneca-user/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-user/actions/workflows/build.yml)
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Maintainability][codeclimate-badge]][codeclimate-url]

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca
npm install seneca-promisify
npm install seneca-entity
npm install @seneca/user
```

## Quick Example

Register a user and create an automatic login for testing.

```js
const Seneca = require('seneca')

var seneca = Seneca()
  .use('promisify')
  .use('entity')
  .use('user')

var out = await seneca.post('sys:user,register:user', {
  handle: 'alice'
})

console.log('USER:', out.user)

out = await seneca.post('sys:user,login:user', {
  handle: 'alice',
  auto: true
})

console.log('LOGIN:', out.login)
```

## More Examples

Because Seneca treats messages as first-class citizens, 90% of unit
testing can be implemented with message scenarios that also provide
detailed usage examples:

* [register_get](test/register_get.calls.js)
* [password](test/password.calls.js)
* [login](test/login.calls.js)
* [logout](test/logout.calls.js)

## Motivation

This plugin provides a complete set of common user management actions
for Seneca-based microservices, including registration, login, logout,
password management, and verification workflows.

## Support

If you have any questions, [open an issue][github-issue] or contact
the [Senecajs team][senecajs-org].

## API

Full action pattern reference available in the [action descriptions](README.md#action-descriptions).

## Contributing

The [Senecajs org][senecajs-org] encourages open participation. If you
feel you can help in any way, be it with documentation, examples,
extra testing, or new features please get in touch.

## Background

This plugin was created to provide standardized user management
for the Seneca microservices framework. It is part of the
[Voxgig](https://www.voxgig.com) open source initiative.

## License

Copyright (c) 2010-2024, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[Seneca.js]: https://www.npmjs.com/package/seneca
[coveralls-badge]: https://coveralls.io/repos/github/senecajs/seneca-user/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/senecajs/seneca-user?branch=master
[codeclimate-badge]: https://api.codeclimate.com/v1/badges/404faaa89a95635ddfc0/maintainability
[codeclimate-url]: https://codeclimate.com/github/senecajs/seneca-user/maintainability
[npm-badge]: https://img.shields.io/npm/v/@seneca/user.svg
[npm-url]: https://npmjs.com/package/@seneca/user
[senecajs-org]: https://github.com/senecajs/
[github-issue]: https://github.com/senecajs/seneca-user/issues
