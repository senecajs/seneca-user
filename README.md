# @seneca/user

Business logic for user management.


<!--START:action-list-->


## Action Patterns

* [adjust:user,sys:user](#-adjustusersysuser-)
* [auth:user,sys:user](#-authusersysuser-)
* [change:pass,sys:user](#-changepasssysuser-)
* [change:handle,sys:user](#-changehandlesysuser-)
* [change:email,sys:user](#-changeemailsysuser-)
* [change:password,sys:user](#-changepasswordsysuser-)
* [check:verify,sys:user](#-checkverifysysuser-)
* [check:exists,sys:user](#-checkexistssysuser-)
* [cmd:encrypt,hook:password,sys:user](#-cmdencrypthookpasswordsysuser-)
* [cmd:pass,hook:password,sys:user](#-cmdpasshookpasswordsysuser-)
* [get:user,sys:user](#-getusersysuser-)
* [list:user,sys:user](#-listusersysuser-)
* [list:login,sys:user](#-listloginsysuser-)
* [list:verify,sys:user](#-listverifysysuser-)
* [login:user,sys:user](#-loginusersysuser-)
* [logout:user,sys:user](#-logoutusersysuser-)
* [make:verify,sys:user](#-makeverifysysuser-)
* [register:user,sys:user](#-registerusersysuser-)
* [remove:user,sys:user](#-removeusersysuser-)
* [sys:user,update:user](#-sysuserupdateuser-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `adjust:user,sys:user` &raquo;

Adjust user status idempotently (activated, etc.).


#### Parameters


* _active_ : boolean <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  user: 'user entity'
}
```


----------
### &laquo; `auth:user,sys:user` &raquo;

Authenticate a login using token


#### Parameters


* _token_ : string <i><small>{presence:required}</small></i>
* _user_fields_ : array <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if login is active',
  user: 'user entity',
  login: 'user entity'
}
```


----------
### &laquo; `change:pass,sys:user` &raquo;

Change user password.


#### Parameters


* _pass_ : string
* _repeat_ : string <i><small>{presence:optional}</small></i>
* _verify_ : string <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if changed',
  user: 'user entity'
}
```


----------
### &laquo; `change:handle,sys:user` &raquo;

Change user handle.


#### Parameters


* _new_handle_ : string
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if changed',
  user: 'user entity'
}
```


----------
### &laquo; `change:email,sys:user` &raquo;

Change user email.


#### Parameters


* _new_email_ : string
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if changed',
  user: 'user entity'
}
```


----------
### &laquo; `change:password,sys:user` &raquo;

Change user password.


#### Parameters


* _pass_ : string
* _repeat_ : string <i><small>{presence:optional}</small></i>
* _verify_ : string <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if changed',
  user: 'user entity'
}
```


----------
### &laquo; `check:verify,sys:user` &raquo;

Check a verfication entry.


#### Parameters


* _kind_ : string <i><small>{presence:optional}</small></i>
* _code_ : string <i><small>{presence:optional}</small></i>
* _now_ : number <i><small>{presence:optional}</small></i>
* _expiry_ : boolean <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if valid',
  why: 'string coded reason if not valid'
}
```


----------
### &laquo; `check:exists,sys:user` &raquo;

Check user exists.


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user exists',
  user: 'user entity'
}
```


----------
### &laquo; `cmd:encrypt,hook:password,sys:user` &raquo;

Encrypt a plain text password string.




#### Examples



* `cmd:encrypt,hook:password,sys:user,pass:foofoobarbar`
  * Result: {ok:true, pass:_encrypted-string_, salt:_string_}
#### Parameters


* _salt_ : string <i><small>{presence:optional}</small></i>
* _pass_ : string <i><small>{presence:optional}</small></i>
* _password_ : string <i><small>{presence:optional}</small></i>
* _rounds_ : number <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if encryption succeeded',
  pass: 'encrypted password string',
  salt: 'salt value string'
}
```


----------
### &laquo; `cmd:pass,hook:password,sys:user` &raquo;

Validate a plain text password string.




#### Examples



* `cmd:pass,hook:password,sys:user,pass:goodpassword`
  * Result: {ok:true}
#### Parameters


* _salt_ : string
* _pass_ : string
* _proposed_ : string
* _rounds_ : number <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if password is valid',
  why: 'string coded reason if not valid'
}
```


----------
### &laquo; `get:user,sys:user` &raquo;

Get user details


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  user: 'user entity'
}
```


----------
### &laquo; `list:user,sys:user` &raquo;

List users


#### Parameters


* _active_ : boolean <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  items: 'user entity item list'
}
```


----------
### &laquo; `list:login,sys:user` &raquo;

List logins for a user


#### Parameters


* _active_ : boolean <i><small>{presence:optional}</small></i>
* _login_q_ : object <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  items: 'user entity item list'
}
```


----------
### &laquo; `list:verify,sys:user` &raquo;

Create a verification entry (multiple use cases).


#### Parameters


* _kind_ : string
* _code_ : string <i><small>{presence:optional}</small></i>
* _once_ : boolean <i><small>{presence:optional}</small></i>
* _valid_ : boolean <i><small>{presence:optional}</small></i>
* _custom_ : object <i><small>{presence:optional}</small></i>
* _expire_point_ : number <i><small>{presence:optional}</small></i>
* _expire_duration_ : number <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  verify: 'verify entity'
}
```


----------
### &laquo; `login:user,sys:user` &raquo;

Login user


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>
* _auto_ : boolean <i><small>{presence:optional}</small></i>
* _pass_ : string <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user logged in',
  user: 'user entity',
  login: 'login entity'
}
```


----------
### &laquo; `logout:user,sys:user` &raquo;

Login user


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>
* _token_ : string <i><small>{presence:optional}</small></i>
* _login_in_ : string <i><small>{presence:optional}</small></i>
* _login_q_ : object <i><small>{presence:optional,default:{}}</small></i>
* _load_logins_ : boolean <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user logged in',
  count: 'number of logouts'
}
```


----------
### &laquo; `make:verify,sys:user` &raquo;

Create a verification entry (multiple use cases).


#### Parameters


* _kind_ : string
* _code_ : string <i><small>{presence:optional}</small></i>
* _once_ : boolean <i><small>{presence:optional}</small></i>
* _valid_ : boolean <i><small>{presence:optional}</small></i>
* _custom_ : object <i><small>{presence:optional}</small></i>
* _expire_point_ : number <i><small>{presence:optional}</small></i>
* _expire_duration_ : number <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  verify: 'verify entity'
}
```


----------
### &laquo; `register:user,sys:user` &raquo;

Register a new user


#### Parameters


* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _user_ : object <i><small>{unknown:true}</small></i>
* _user_data_ : object <i><small>{unknown:true}</small></i>




#### Replies With


```
{
  ok: '_true_ if user registration succeeded',
  user: 'user entity'
}
```


----------
### &laquo; `remove:user,sys:user` &raquo;

Remove a user


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user removed',
  user: 'user entity'
}
```


----------
### &laquo; `sys:user,update:user` &raquo;

Update a user


#### Parameters


* _user_ : object <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user updated',
  user: 'user entity'
}
```


----------


<!--END:action-desc-->

