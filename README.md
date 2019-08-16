# @seneca/user


Next version of seneca-user - work in progress!



<!--START:action-list-->


## Action Patterns

* [cmd:encrypt_password,sys:user](#-cmdencrypt_passwordsysuser-)
* [cmd:register,sys:user](#-cmdregistersysuser-)
* [cmd:login,sys:user](#-cmdloginsysuser-)
* [cmd:create_verify,sys:user](#-cmdcreate_verifysysuser-)
* [cmd:verify_password,sys:user](#-cmdverify_passwordsysuser-)
* [cmd:change_password,sys:user](#-cmdchange_passwordsysuser-)
* [cmd:confirm,sys:user](#-cmdconfirmsysuser-)
* [cmd:auth,sys:user](#-cmdauthsysuser-)
* [cmd:logout,sys:user](#-cmdlogoutsysuser-)
* [cmd:clean,sys:user](#-cmdcleansysuser-)
* [cmd:create_reset,sys:user](#-cmdcreate_resetsysuser-)
* [cmd:load_reset,sys:user](#-cmdload_resetsysuser-)
* [cmd:execute_reset,sys:user](#-cmdexecute_resetsysuser-)
* [cmd:update,sys:user](#-cmdupdatesysuser-)
* [cmd:unlock,sys:user](#-cmdunlocksysuser-)
* [cmd:enable,sys:user](#-cmdenablesysuser-)
* [cmd:activate,sys:user](#-cmdactivatesysuser-)
* [cmd:disable,sys:user](#-cmddisablesysuser-)
* [cmd:deactivate,sys:user](#-cmddeactivatesysuser-)
* [cmd:delete,sys:user](#-cmddeletesysuser-)
* [cmd:remove,sys:user](#-cmdremovesysuser-)
* [cmd:entity,sys:user](#-cmdentitysysuser-)
* [get:user,sys:user](#-getusersysuser-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `cmd:encrypt_password,sys:user` &raquo;

Encrypt a plain text password string.




#### Examples



* `cmd:encrypt_password,sys:user,password:foo,repeat:foo`
  * Result: {ok:true,pass:_encrypted-string_, salt:_string_}
#### Parameters


* _password_: string
  * Password plain text string.
* _repeat_: string
  * Password plain text string, repeated.




#### Replies With


```
{
  ok: '_true_ if encryption succeeded',
  pass: 'encrypted password string',
  salt: 'salt value string'
}
```


----------
### &laquo; `cmd:register,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:login,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:create_verify,sys:user` &raquo;

Create a onetime short-lived verification token.


#### Parameters


* _mode_: string
  * Verification mode: verify: normal, else hellban.
* _user_: object
  * User details
* _score_: number <i><small>{unsafe:false,presence:optional}</small></i>
  * undefined
* _expire_: number <i><small>{unsafe:false,presence:optional}</small></i>
  * undefined


----------
### &laquo; `cmd:verify_password,sys:user` &raquo;

No description provided.


#### Parameters


* _proposed_: { 'required

: true, 'string

: true }
* _pass_: { 'required

: true, 'string

: true }
* _salt_: { 'required

: true, 'string

: true }


----------
### &laquo; `cmd:change_password,sys:user` &raquo;

No description provided.


#### Parameters


* _nick_: { 'string

: true }
* _email_: { 'string

: true }
* _username_: { 'string

: true }
* _user_: { 'type

: [ 'object', 'string' ] }
* _password_: { 'string

: true, 'required

: true }
* _repeat_: { 'string

: true }


----------
### &laquo; `cmd:confirm,sys:user` &raquo;

No description provided.


#### Parameters


* _code_: { 'string

: true, 'required

: true }


----------
### &laquo; `cmd:auth,sys:user` &raquo;

No description provided.


#### Parameters


* _token_: { 'required

: true, 'string

: true }


----------
### &laquo; `cmd:logout,sys:user` &raquo;

No description provided.


#### Parameters


* _token_: { 'required

: true, 'string

: true }


----------
### &laquo; `cmd:clean,sys:user` &raquo;

No description provided.


#### Parameters


* _user_: { 'required

: true, 'entity

: 'sys/user' }


----------
### &laquo; `cmd:create_reset,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:load_reset,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:execute_reset,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:update,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:unlock,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:enable,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:activate,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:disable,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:deactivate,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:delete,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:remove,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:entity,sys:user` &raquo;

No description provided.



----------
### &laquo; `get:user,sys:user` &raquo;

No description provided.



----------


<!--END:action-desc-->

