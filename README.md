# seneca-user

## A user management plugin for the [Seneca](http://senecajs.org) toolkit

This module is a plugin for the Seneca framework. It provides business logic for user management, such as:

   * login
   * logout
   * registration
   * password handling, incl. resets

There are two core concepts: user and login. A _user_, storing the user account details and encrypted passwords, 
and a _login_, representing an instance of a user that has been authenticated. A user can have multiple logins.

This module does not make any assumptions about the context it runs in. 
Use the [seneca-auth](http://github.com/rjrodger/seneca-auth) plugin to handle web and social media authentication.

For a working example, see the <a href="https://github.com/rjrodger/seneca-examples/tree/master/user-accounts">Seneca user accounts example</a>.


## Support

If you're using this module, feel free to contact me on Twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.2.3

Tested on: Node 0.10.6, 0.8.7, Seneca 0.5.10




## Quick example

```JavaScript
var seneca = require('seneca')()
seneca.use('user')

seneca.ready(function(){

  var userpin = seneca.pin({role:'user',cmd:'*'})

  userpin.register( {name:"Flann O'Brien",email:'nincompoop@deselby.com',password:'blackair'}, 
  function(err,out) {

    userpin.login({email:'nincompoop@deselby.com',password:'bicycle'}, function(err,out){
      console.log('login success: '+out.ok)

      userpin.login({email:'nincompoop@deselby.com',password:'blackair'}, function(err,out){
        console.log('login success: '+out.ok)
        console.log('login instance: '+out.login)
      })
    })
  })
})
```

This example, uses a _pin_ for convenience: <code>userpin.register( ... )</code> is the same as 
<code>seneca.act({role:'user',cmd:'register', ... )</code>.

In the example code, a user is registered, and then two login attempts are made. The first with an incorrect password, the second with the correct
password. The successful login provides a login instance. The _login.id_ property can be used to authenticate this login. For example,
the [seneca-auth](http://github.com/rjrodger/seneca-auth) plugin uses this token as a HTTP authentication cookie.

To run this example (and the other code in this README), try:

```sh
node test/readme.js
```


## Deeper example

Take a look at the <a href="http://github.com/rjrodger/seneca-examples">user accounts example</a>.



## Install

```sh
npm install seneca
npm install seneca-user
```

You'll need the [seneca](http://github.com/rjrodger/seneca) module to use this module - it's just a plugin.



## Usage

To load the plugin:

```JavaScript
seneca.use('user', { ... options ... })
```

The user and login data is persisted using Seneca entities. These have
names _sys/user_ and _sys/login_.

Passwords are not stored in plaintext, but using an ~10k round salted SHA512 hash. In
the context of password reset functionality, this means you can
generate new passwords, but cannot recover old ones. 
[This is what you want](http://www.codinghorror.com/blog/2007/09/youre-probably-storing-passwords-incorrectly.html).

There are separate actions to encrypt and verify passwords, so you can do things your own way if you like.

To support different use cases, users can be identified by either a
_nick_ or their email address. The _nick_ property is the traditional
'username', but does not need to be used in this fashion (hence the name 'nick').

All actions defined by this plugin return meta data objects containing the results of the action. The meta data object
contains an _ok_ field that is either true or false, indicating the success or failure of the action. For example, a login attempt with an invalid password will result in an <code>{ok:false,...}</code>. When relevant, a _why_ property is also provided, with a code that indicates the reason for the result. For example: {...,why:'user-not-found'}.



## Options

   * _rounds_: number of SHA512 rounds to use for password encryption, default: 11111
   * _autopass_: automatically generate an (unrecoverable) password if none is supplied - mostly good for testing, default: true
   * _mustrepeat_: you must provide a _repeat_ argument (a repeat of the password) when setting a password
   * _resetperiod_: duration in millis that a password reset token is valid, default: 24 hours

To set options, do so when you load the plugin:

```javascript
seneca.use('user',{ resetperiod: 3600*1000 })
```



## Entities

### User

The user entity has a default type of _-/sys/user_ and standard properties:

   * _nick_: Username, mostly. If not provided, will be set to email value.
   * _email_: Email address. At least one of nick or email is required.
   * _name_: Name of user. Just a text field. [Cultural imperialism damages your conversions, ya know...](http://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/)!
   * _active_: if true, user can log in, if false, user can't. Default: true.
   * _when_: creation time, ISO String, like 2013-03-21T17:32:24.039Z
   * _salt_: salt for encrypted password
   * _pass_: encrypted password

You can add your own properties, but be careful not to use the standard property names.


### Login

The login entity has a default type of _-/sys/login_ and standard properties:

   * _id_: authentication token, UUID
   * _nick_: copied from user
   * _user_: user.id string
   * _when_: creation time, ISO String, like 2013-03-21T17:32:24.039Z
   * _active_: if true, login against this token will succeed, otherwise not

You can add your own properties, but be careful not to use the standard property names.


### Reset

The reset entity has a default type of _-/sys/reset_ and standard properties:

   * _id_: authentication token, UUID
   * _nick_: copied from user
   * _user_: user.id string
   * _when_: creation time, ISO String, like 2013-03-21T17:32:24.039Z
   * _active_: if true, reset against this token will succeed, otherwise not

You can add your own properties, but be careful not to use the standard property names.



## Actions

All actions provide results via the standard callback format: <code>function(error,data){ ... }</code>.

To customize the behavior of the plugin, override these actions, and provide your own business logic. You call call _this.prior_
inside each custom action to perform the default behaviour - see the [Customization] section below.


### role:user, cmd:login

Login an existing user. Creates a new sys_login entry.

#### Arguments:
   
   * _nick_: required if no email, identifies user, alias: username
   * _email_: required if no nick, identifies user
   * _password_: password as entered by user, optional if using _auto_
   * _auto_: automatic login without password, default: _false_. Use this to generate login tokens.
   * _user_: specify user using a sys/user entity - for convenience use inside your own actions, when you already have a user entity loaded

#### Provides:

Object with properties:

   * _ok_: true if login succeeded, false if not
   * _login_: login entity, id is the login token, used as cookie
   * _user_: user entity
   * _why_: indicates reason login failed or succeeded, refer to [source](https://github.com/rjrodger/seneca-user/blob/master/lib/user.js) for codes.



### role:user, cmd:logout

Logout a user. Update _sys/login_ entry to _active:false_. Adds _ended_ field with ISOString date time.  

#### Arguments:
   
   * _token_: existing login token, maybe from a cookie

#### Provides:

Same object format as login command result: {ok:true|false,user:,login:}



### role:user, cmd:register

Register a new user. You'll probably call this after a user fills out
a regstration form. Any additional action arguments are saved as user
properties. The nick and email fields will be checked for
uniqueness. The new user is not logged in, use the login action for
that.


#### Arguments:
   
   * _nick_: Username, mostly. If not provided, will be set to args.username value, if defined, otherwise args.email value.
   * _email_: Email address. At least one of nick or email is required.
   * _username_: a convenience - just an alias for nick.
   * _password_: Plaintext password, supplied by user - will be stored encrypted and unrecoverable.
   * _repeat_: Password, repeated. Optional - if provided, must match password.
   * _name_: Name of user. Just a text field.
   * _active_: if true, user can log in, if false, user can't. Default: true.

#### Provides:

Object with properties:

   * _ok_: true if registration succeeded, false if not
   * _user_: new user entity
   * _why_: indicates reason registration failed, refer to [source](https://github.com/rjrodger/seneca-user/blob/master/lib/user.js) for codes.



### role:user, cmd:auth

Authenticate a login token, returning the associated _sys/login_ and _sys/user_ if
the token is valid and active. Use this, for example, when handling
HTTP requests with an authentication cookie, to get the user.


#### Arguments:
   
   * _token_: existing login token, maybe from a cookie

#### Provides:

Same object format as login command result: {ok:true|false,user:,login:}



### role:user, cmd:create_reset

Create a reset token, valid for a 24 hours (use the _resetperiod_ options to alter the validity period). This action
creates an entry in the _sys/reset_ collection.


#### Arguments:

   * _nick_: required if no email, identifies user, alias: username
   * _email_: required if no nick, identifies user
   * _user_: specify user using a sys/user entity - for convenience use inside your own actions, when you already have a user entity loaded
   
#### Provides:

Object with properties:

   * _ok_: true if update succeeded, false if not
   * _user_: _sys/user_ entity
   * _reset_: _sys/reset_ entity


### role:user, cmd:load_reset

Load a _sys/reset_ entity using a reset token. Use this to load the details of a reset request, possible to confirm with user.


#### Arguments:

   * _token_: reset token
   
#### Provides:

Object with properties:

   * _ok_: true if reset found, false if not
   * _user_: _sys/user_ entity
   * _reset_: _sys/reset_ entity
   * _why_: reason for failure


### role:user, cmd:execute_reset

Execute a password reset action. The user identified by the reset token is allowed to change their password. THe reset must be active, and the validity period must not be expired. On successful reset, the _sys/reset_ is deactivated and cannot be reused.


#### Arguments:

   * _token_: reset token
   * _password_: new password
   * _repeat_: optional, repeat of new password
   
#### Provides:

Object with properties:

   * _ok_: true if reset found, false if not
   * _user_: _sys/user_ entity
   * _reset_: _sys/reset_ entity
   * _why_: reason for failure



### role:user, cmd:encrypt_password

Encrypts a plaintext password, providing the salt and ciphertext. The encyption is _options.rounds_ (default:11111) rounds of SHA512.

#### Arguments:
   
   * _password_: plaintext password.
   * _repeat_: optional, repeat of password

#### Provides:

Object with properties:

   * _ok_: true if succeeded
   * _salt_: the salt string
   * _pass_: the ciphertext string
   * _why_: reason for failure


### role:user, cmd:verify_password

Verifies that a password matches a given salt and ciphertext.

#### Arguments:
   
   * _salt_: the salt string to use, find this in user.salt
   * _pass_: the pass string to use, find this in user.pass
   * _proposed_: the proposed plaintext password to verify

#### Provides:

Object with properties:

   * _ok_: true if password matches







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

For more on logging, see the [seneca logging example](http://senecajs.org/logging-example.html).




### Customization

As with all seneca plugins, you can customize behavior simply by overwriting actions.

For example, to add some custom fields when registering a user:


```javascript
    // override by using the same action pattern
    seneca.add({role:'user',cmd:'register'},function(args,done){
    
      // assign user to one of 10 random "teams"
      args.team = Math.floor( 10 * Math.random() )
    
      // this calls the original action, as provided by the user plugin
      this.parent(args,done)
    })
    
    
    userpin.register( {name:"Brian O'Nolan",email:'brian@swim-two-birds.com',password:'na-gCopaleen'}, 
    function(err,out) {
      console.log('user has team: '+out.user.team)
    })
```


## Test

```sh
cd test
mocha user.test.js --seneca.log.print
```


