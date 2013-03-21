# seneca-user

## A user management plugin for the [Seneca](http://senecajs.org) toolkit

This module is a plugin for the Seneca framework. It provides business logic for user management, such as:

   * login
   * logout
   * registration
   * password handling

There are two core concepts: user and login. A _user_, storing the user account details and encrypted passwords, 
and a _login_, representing an instance of a user that has been authenticated. A user can have multiple logins.

This module does not make any assumptions about the context it runs in. 
Use the [seneca-auth](http://github.com/rjrodger/seneca-auth) plugin to handle web and social media authentication.


## Support

If you're using this module, feel free to contact me on twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.2.1 

Tested on: node 0.8.16, seneca 0.5.3

[![Build Status](https://secure.travis-ci.org/rjrodger/seneca-user.png)](http://travis-ci.org/rjrodger/seneca-user)



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
password. The successful login provides a login instance. The _login.token_ property can be used to authenticate this login. For example,
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

The user and login data is persisted using seneca entities. These have
names _sys_user_ and _sys_login_ by default, but can be changed in the
options.

Passwords are not stored in plaintext, but using a salted SHA hash. In
the context of password reminder functionality, this means you can
generate new passwords, but cannot recover old ones. 
[This is what you want](http://www.codinghorror.com/blog/2007/09/youre-probably-storing-passwords-incorrectly.html).

There are separate actions to encrypt and verify passwords, so you can do things your own way if you like.

To support different use cases, users can be identified by either a
_nick_ or their email address. The _nick_ property is the traditional
'username', but does not need to be used in this fashion (hence the name 'nick').



## Options

   * _user_: spec for user entity type, default: {zone:null, base:'sys', name:'user'}. 
   * _login_: spec for login entity type, default: {zone:null, base:'sys', name:'login'}. 


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

   * _token_: authentication token
   * _nick_: copied from user
   * _email_: copied from user
   * _user_: user.id string
   * _when_: creation time, ISO String, like 2013-03-21T17:32:24.039Z
   * _active_: if true, login against this token will succeed, otherwise not

You can add your own properties, but be careful not to use the standard property names.



## Actions

All actions provide results via the standard callback format: <code>function(error,data){ ... }</code>.


### role:user, cmd:login

Login an existing user. Creates a new sys_login entry.

#### Arguments:
   
   * _nick_: required if no email, identifies user
   * _email_: required if no nick, identifies user
   * _password_: password as entered by user
   * _auto_: automatic login without password, default: _false_. Use this to generate login tokens.

#### Provides:

Object with properties:

   * _ok_: true if login succeeded, false if not
   * _login_: login entity, includes login.token property
   * _user_: user entity



### role:user, cmd:logout

Logout a user. Update sys_login entry to active:false. Adds login.ended field with ISOString date time.  

#### Arguments:
   
   * _token_: existing login.token, maybe from a cookie

#### Provides:

Same object format as login command result: {ok:true|false,user:,login:}



### role:user, cmd:register

Register a new user. You'll probably call this after a user fills out a regstration form. Any additional action arguments are saved as
user properties. The nick and email fields will be checked for uniqueness. The new user is not logged in, use the login action for that.


#### Arguments:
   
   * _nick_: Username, mostly. If not provided, will be set to args.username value, if defined, otherwise args.email value.
   * _email_: Email address. At least one of nick or email is required.
   * _username_: a convenience - just an alias for nick.
   * _password_: Plaintext password, supplied by user - will be encrypted.
   * _repeat_: Password, repeated. Optional - if provided, must match password.
   * _name_: Name of user. Just a text field.
   * _active_: if true, user can log in, if false, user can't. Default: true.

#### Provides:

Object with properties:

   * _ok_: true if registration succeeded, false if not
   * _user_: new user entity



### role:user, cmd:auth

Authenticate a login token, returning the associated login and user if
the token is valid and active. Use this, for example, when handling
HTTP requests with an authentication cookie, to get the user.


#### Arguments:
   
   * _token_: existing login.token, maybe from a cookie

#### Provides:

Same object format as login command result: {ok:true|false,user:,login:}


### role:user, cmd:update

Update the user's details, such as nick and/or password.


#### Arguments:
   
   * _orig_nick_: original nick, so user can be found, or use orig_email
   * _orig_email_: original email, so user can be found, or use orig_nick
   * _nick_: new nick, optional
   * _email_: new email, optional
   * _name_: new name, optional
   * _password_: new password, optional
   * _repeat_: new password, repeated. Optional - if provided, must match password


#### Provides:

Object with properties:

   * _ok_: true if update succeeded, false if not
   * _user_: user entity



### role:user, cmd:clean

Strips sensitive information from user entity. In particular, the pass, salt, and active properties.

#### Arguments:
   
None.

#### Provides:

User entity.



### role:user, cmd:encrypt_password

Encrypts a plaintext password, providing the salt and ciphertext.

#### Arguments:
   
   * _password_: plaintext password.

#### Provides:

Object with properties:

   * _salt_: the salt string
   * _pass_: the ciphertext string


### role:user, cmd:verify_password

Verifies that a password matches a given salt and ciphertext.

#### Arguments:
   
   * _salt_: the salt string to use, take this from user.salt
   * _pass_: the pass string to use, take this from user.pass
   * _proposed_: the proposed plaintext password to verify

#### Provides:

Object with properties:

   * _ok_: true if password matches







### role:user, cmd:entity

Provide an instance of the user or login entities. Used by other
plugins to get the right entity type for additional user operations.

#### Arguments:
   
   * _kind_: 'user' or 'login'

#### Provides:

Seneca entity object for user or login.




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


