![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) User Management Plugin

# seneca-user
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter chat][gitter-badge]][gitter-url]

Lead Maintainers: [Mircea Alexandru](https://github.com/mirceaalexandru) and [Mihai Dima](https://github.com/mihaidma)

## A user management plugin for the [Seneca](http://senecajs.org) toolkit

This module is a plugin for the Seneca framework. It provides business logic for user management, such as:

   * login
   * logout
   * registration
   * password handling, incl. resets

This plugin needs [seneca-basic][seneca-basic-url] and [seneca-entity][seneca-entity-url] plugins to function properly.

There are two core concepts: user and login. A _user_, storing the user account details and encrypted passwords,
and a _login_, representing an instance of a user that has been authenticated. A user can have multiple logins.

This module does not make any assumptions about the context it runs in.
Use the [seneca-auth](http://github.com/senecajs/seneca-auth) plugin to handle web and social media authentication.

For a working example, see the [Seneca user accounts example](https://github.com/rjrodger/seneca-examples/tree/master/user-accounts)

## Support

If you're using this module, feel free to contact me on Twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

## Code examples

For code samples, please see the [tests](https://github.com/senecajs/seneca-user/tree/master/test) for this plugin.

### Seneca compatibility

Supports Seneca versions **1.x** - **3.x**

## Install

```sh
npm install seneca
npm install seneca-user
```

You'll need the [seneca](http://github.com/senecajs/seneca) module to use this module - it's just a plugin.

## Quick example

```js
var seneca = require('seneca')()
seneca.use(require('seneca-basic'))
seneca.use(require('seneca-entity'))
seneca.use(require('seneca-user'))

seneca.ready(function (){
  seneca.act( {role: 'user', cmd: 'register', name: "Flann O'Brien", email: 'nincompoop@deselby.com', password: 'blackair'},
  function (err, out) {

    seneca.act({role: 'user', cmd: 'login', email: 'nincompoop@deselby.com', password: 'bicycle'}, function (err, out) {
      console.log('login success: ' + out.ok)

      seneca.act({role: 'user', cmd: 'login', email: 'nincompoop@deselby.com', password: 'blackair'}, function (err,out) {
        console.log('login success: ' + out.ok)
        console.log('login instance: ' + out.login)
      })
    })
  })
})
```

In the example code, a user is registered, and then two login attempts are made. The first with an incorrect password, the second with the correct
password. The successful login provides a login instance. The `login.id` property can be used to authenticate this login. For example,
the [seneca-auth](http://github.com/senecajs/seneca-auth) plugin uses this token as a HTTP authentication cookie.

To run this example (and the other code in this README), try:

```sh
node test/readme.js
```

## Deeper example

Take a look at the [user accounts example](http://github.com/rjrodger/seneca-examples).

## Usage

To load the plugin:

```js
seneca.use('user', { ... options ... })
```

The user and login data is persisted using Seneca entities. These have
names `sys/user` and `sys/login`.

Passwords are not stored in plaintext, but using an ~10k round salted SHA512 hash. In
the context of password reset functionality, this means you can
generate new passwords, but cannot recover old ones.
[This is what you want](http://www.codinghorror.com/blog/2007/09/youre-probably-storing-passwords-incorrectly.html).

There are separate actions to encrypt and verify passwords, so you can do things your own way if you like.

To support different use cases, users can be identified by either a
`nick` or their email address. The `nick` property is the traditional
'username', but does not need to be used in this fashion (hence the name 'nick').

All actions defined by this plugin return meta data objects containing the results of the action. The meta data object
contains an `ok` field that is either true or false, indicating the success or failure of the action. For example, a login attempt with an invalid password will result in an `{ok:false,...}`. When relevant, a `why` property is also provided, with a code that indicates the reason for the result. For example: {...,why:'user-not-found'}.

## Options

   * `rounds`: number of SHA512 rounds to use for password encryption, default: 11111
   * `autopass`: automatically generate an (unrecoverable) password if none is supplied - mostly good for testing, default: true
   * `mustrepeat`: you must provide a `repeat` argument (a repeat of the password) when setting a password
   * `resetperiod`: duration in millis that a password reset token is valid, default: 24 hours
   * `pepper`: used in addition to password salts, a pepper is very similar but is stored in code instead of a database.
   * `failedCount`: number of failed attempts before the account is locked. Disabled by default.

To set options, do so when you load the plugin:

```js
seneca.use('user', { resetperiod: 3600*1000 })
```
## Annotated Source Code

The full source code of this plugin is [annotated](http://senecajs.github.io/seneca-user/user.html).

## Entities

### User

The user entity has a default type of `-/sys/user` and standard properties:

   * `nick`: Username, mostly. If not provided, will be set to email value.
   * `email`: Email address. At least one of nick or email is required.
   * `name`: Name of user. Just a text field. [Cultural imperialism damages your conversions, ya know...](http://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/)!
   * `active`: if true, user can log in, if false, user can't. Default: true.
   * `when`: creation time, ISO String, like 2013-03-21T17:32:24.039Z
   * `salt`: salt for encrypted password
   * `pass`: encrypted password

You can add your own properties, but be careful not to use the standard property names.


### Login

The login entity has a default type of `-/sys/login` and standard properties:

   * `id`: authentication token, UUID
   * `nick`: copied from user
   * `user`: user.id string
   * `when`: creation time, ISO String, like 2013-03-21T17:32:24.039Z
   * `active`: if true, login against this token will succeed, otherwise not

You can add your own properties, but be careful not to use the standard property names.


### Reset

The reset entity has a default type of `-/sys/reset` and standard properties:

   * `id`: authentication token, UUID
   * `nick`: copied from user
   * `user`: user.id string
   * `when`: creation time, ISO String, like 2013-03-21T17:32:24.039Z
   * `active`: if true, reset against this token will succeed, otherwise not

You can add your own properties, but be careful not to use the standard property names.



## Actions

All actions provide results via the standard callback format: <code>function(error,data){ ... }</code>.

To customize the behavior of the plugin, override these actions, and provide your own business logic. You can call `this.prior`
inside each custom action to perform the default behaviour - see the [Customization] section below.


### role:user, cmd:login

Login an existing user. Creates a new `sys_login` entry.

#### Arguments:

   * `nick`: required if no email, identifies user, alias: username
   * `email`: required if no nick, identifies user
   * `password`: password as entered by user, optional if using _auto
   * `auto`: automatic login without password, default: _false_. Use this to generate login tokens.
   * `user`: specify user using a sys/user entity - for convenience use inside your own actions, when you already have a user entity loaded

#### Provides:

Object with properties:

   * `ok_: true if login succeeded, false if not
   * `login`: login entity, id is the login token, used as cookie
   * `user_: user entity
   * `why`: indicates reason login failed or succeeded, refer to [source](https://github.com/senecajs/seneca-user/blob/master/user.js) for codes.



### role:user, cmd:logout

Logout a user. Update _sys/login_ entry to _active:false_. Adds _ended_ field with ISOString date time.

#### Arguments:

   * `token`: existing login token, maybe from a cookie

#### Provides:

Same object format as login command result: {ok:true|false,user:,login:}



### role:user, cmd:register

Register a new user. You'll probably call this after a user fills out
a regstration form. Any additional action arguments are saved as user
properties. The nick and email fields will be checked for
uniqueness. The new user is not logged in, use the login action for
that.


#### Arguments:

   * `nick`: Username, mostly. If not provided, will be set to args.username value, if defined, otherwise args.email value
   * `email`: Email address. At least one of nick or email is required
   * `username`: a convenience - just an alias for nick
   * `password`: Plaintext password, supplied by user - will be stored encrypted and unrecoverable
   * `repeat`: Password, repeated. Optional - if provided, must match password
   * `name`: Name of user. Just a text field.
   * `active`: if true, user can log in, if false, user can't. Default: true

#### Provides:

Object with properties:

   * `ok`: true if registration succeeded, false if no
   * `user`: new user entity
   * `why`: indicates reason registration failed, refer to [source](https://github.com/senecajs/seneca-user/blob/master/user.js) for codes`



### role:user, cmd:auth

Authenticate a login token, returning the associated `sys/login` and `sys/user` if
the token is valid and active. Use this, for example, when handling
HTTP requests with an authentication cookie, to get the user.


#### Arguments:

   * `token`: existing login token, maybe from a cookie

#### Provides:

Same object format as login command result: `{ok:true|false,user:,login:}`



### role:user, cmd:create_reset

Create a reset token, valid for a 24 hours (use the `resetperiod` options to alter the validity period). This action
creates an entry in the `sys/reset` collection.


#### Arguments:

   * `nick`: required if no email, identifies user, alias: `username`
   * `email`: required if no nick, identifies user
   * `user`: specify user using a sys/user entity - for convenience use inside your own actions, when you already have a user entity loaded

#### Provides:

Object with properties:

   * `ok`: true if update succeeded, false if not
   * `user`: `sys/user` entity
   * `reset`: `sys/reset` entity


### role:user, cmd:load_reset

Load a `sys/reset` entity using a reset token. Use this to load the details of a reset request, possible to confirm with user.


#### Arguments:

   * `token`: reset token

#### Provides:

Object with properties:

   * `ok`: true if reset found, false if not
   * `user`: `sys/user` entity
   * `reset`: `sys/reset` entity
   * `why`: reason for failure


### role:user, cmd:execute_reset

Execute a password reset action. The user identified by the reset token is allowed to change their password. THe reset must be active, and the validity period must not be expired. On successful reset, the `sys/reset` is deactivated and cannot be reused.


#### Arguments:

   * `token`: reset token
   * `password`: new password
   * `repeat`: optional, repeat of new password

#### Provides:

Object with properties:

   * `ok`: true if reset found, false if not
   * `user`: `sys/user` entity
   * `reset`: `sys/reset` entity
   * `why`: reason for failure



### role:user, cmd:encrypt_password

Encrypts a plaintext password, providing the salt and ciphertext. The encyption is `options.rounds` (default:11111) rounds of SHA512.

#### Arguments:

   * `password`: plaintext password.
   * `repeat`: optional, repeat of password

#### Provides:

Object with properties:

   * `ok`: true if succeeded
   * `salt`: the salt string
   * `pass`: the ciphertext string
   * `why`: reason for failure


### role:user, cmd:verify_password

Verifies that a password matches a given salt and ciphertext.

#### Arguments:

   * `salt`: the salt string to use, find this in user.salt
   * `pass`: the pass string to use, find this in user.pass
   * `proposed`: the proposed plaintext password to verify

#### Provides:

Object with properties:

   * `ok`: true if password matches

### role:user, cmd:update

Updates a user.

#### Arguments:

   * `nick`: the nick of the user to be updated
   * `orig_nick`: if nick will be changed on this update then `orig_nick` will be used to identify the user
   * `email`: the email of the user to be updated
   * `orig_email`: if email will be changed on this update then `orig_email` will be used to identify the user

At least one of these arguments must be present.

#### Provides:

Object with properties:

   * `ok`: true if operation is OK

### role:user, cmd:remove

Deletes an user and all relationed records.

#### Arguments:

   * `nick`: the nick of the user to be updated

#### Provides:

Object with properties:

   * `ok`: true if operation is OK


### role:user, cmd:activate

Enables an user.

#### Arguments:

   * `nick`: the nick of the user to be updated
   * `email`: the email of the user to be updated

At least one of these arguments must be present

#### Provides:

Object with properties:

   * `ok`: true if operation is OK

### role:user, cmd:deactivate

Disables an user.

#### Arguments:

   * `nick`: the nick of the user to be updated
   * `email`: the email of the user to be updated

At least one of these arguments must be present

#### Provides:

Object with properties:

   * `ok`: true if operation is OK

### role:user, cmd:unlock

Removes the lock form a user account

#### Arguments:

   * `id`: the id of the user

#### Provides:

   * `ok`: true if the account was unlocked

## Logging

To see what this plugin is doing, try:

```sh
node your-app.js --seneca.log=plugin:user
```

This will print action logs and plugin logs for the user plugin. To skip the action logs, use:

```sh
node your-app.js --seneca.log=type:plugin,plugin:user
```

You can also set up the logging programmatically:

    var seneca = require('seneca')({
      log:{
        map:[
          {plugin:'user',handler:'print'}
        ]
      }
    })

For more on logging, see the [seneca logging example](http://senecajs.org/tutorials/logging-with-seneca.html).


### Customization

As with all seneca plugins, you can customize behavior simply by overwriting actions.

For example, to add some custom fields when registering a user:


```js
    // override by using the same action pattern
    seneca.add({role:' user', cmd: 'register'},function (args, done) {

      // assign user to one of 10 random "teams"
      args.team = Math.floor(10 * Math.random())

      // this calls the original action, as provided by the user plugin
      this.prior(args,done)
    })


    userpin.register({name: "Brian O'Nolan", email: 'brian@swim-two-birds.com', password: 'na-gCopaleen'},
    function (err, out) {
      console.log('user has team: ' + out.user.team)
    })
```

## Contributing

The [Senecajs org][] encourages open participation. If you feel you
can help in any way, be it with documentation, examples, extra
testing, or new features please get in touch.

## Test

```sh
npm test
```

## License

Copyright (c) 2012-2016, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[npm-badge]: https://badge.fury.io/js/seneca-user.svg
[npm-url]: https://badge.fury.io/js/seneca-user
[travis-badge]: https://api.travis-ci.org/senecajs/seneca-user.svg
[travis-url]: https://travis-ci.org/senecajs/seneca-user
[coveralls-badge]:https://coveralls.io/repos/senecajs/seneca-user/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/senecajs/seneca-user?branch=master
[david-badge]: https://david-dm.org/senecajs/seneca-user.svg
[david-url]: https://david-dm.org/senecajs/seneca-user
[gitter-badge]: https://badges.gitter.im/senecajs/seneca.svg
[gitter-url]: https://gitter.im/senecajs/seneca
[Senecajs org]: https://github.com/senecajs/
[seneca-basic-url]: https://github.com/senecajs/seneca-basic
[seneca-entity-url]: https://github.com/senecajs/seneca-entity
