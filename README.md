

<!--START:action-list-->


## Action Patterns

* [cmd:encrypt_password,role:user](#-cmdencrypt_passwordroleuser-)
* [cmd:verify_password,role:user](#-cmdverify_passwordroleuser-)
* [cmd:change_password,role:user](#-cmdchange_passwordroleuser-)
* [cmd:register,role:user](#-cmdregisterroleuser-)
* [cmd:login,role:user](#-cmdloginroleuser-)
* [cmd:confirm,role:user](#-cmdconfirmroleuser-)
* [cmd:auth,role:user](#-cmdauthroleuser-)
* [cmd:logout,role:user](#-cmdlogoutroleuser-)
* [cmd:clean,role:user](#-cmdcleanroleuser-)
* [cmd:create_reset,role:user](#-cmdcreate_resetroleuser-)
* [cmd:load_reset,role:user](#-cmdload_resetroleuser-)
* [cmd:execute_reset,role:user](#-cmdexecute_resetroleuser-)
* [cmd:update,role:user](#-cmdupdateroleuser-)
* [cmd:unlock,role:user](#-cmdunlockroleuser-)
* [cmd:enable,role:user](#-cmdenableroleuser-)
* [cmd:activate,role:user](#-cmdactivateroleuser-)
* [cmd:disable,role:user](#-cmddisableroleuser-)
* [cmd:deactivate,role:user](#-cmddeactivateroleuser-)
* [cmd:delete,role:user](#-cmddeleteroleuser-)
* [cmd:remove,role:user](#-cmdremoveroleuser-)
* [cmd:entity,role:user](#-cmdentityroleuser-)
* [get:user,role:user](#-getuserroleuser-)
* [init:user](#-inituser-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `cmd:encrypt_password,role:user` &raquo;

Encrypt a plain text password string.




#### Examples



* `cmd:encrypt_password,role:user,password:foo,repeat:foo`
  * Result: {ok:true,pass:_encrypted-string_, salt:_string_}
#### Parameters


* _password_: string <i><small>{presence:required}</small></i>
  * Password plain text string.
* _repeat_: string <i><small>{presence:required}</small></i>
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
### &laquo; `cmd:verify_password,role:user` &raquo;

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
### &laquo; `cmd:change_password,role:user` &raquo;

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
### &laquo; `cmd:register,role:user` &raquo;

No description provided.


#### Parameters


* _nick_: { 'string

: true }
* _email_: { 'string

: true }
* _username_: { 'string

: true }
* _password_: { 'string

: true }
* _repeat_: { 'string

: true }
* _name_: { 'string

: true }
* _active_: { 'boolean

: true }
* _confirm_: { 'boolean

: true }


----------
### &laquo; `cmd:login,role:user` &raquo;

No description provided.


#### Parameters


* _nick_: { 'string

: true }
* _email_: { 'string

: true }
* _username_: { 'string

: true }
* _user_: { 'object

: true }
* _password_: { 'string

: true }
* _auto_: { 'boolean

: true }


----------
### &laquo; `cmd:confirm,role:user` &raquo;

No description provided.


#### Parameters


* _code_: { 'string

: true, 'required

: true }


----------
### &laquo; `cmd:auth,role:user` &raquo;

No description provided.


#### Parameters


* _token_: { 'required

: true, 'string

: true }


----------
### &laquo; `cmd:logout,role:user` &raquo;

No description provided.


#### Parameters


* _token_: { 'required

: true, 'string

: true }


----------
### &laquo; `cmd:clean,role:user` &raquo;

No description provided.


#### Parameters


* _user_: { 'required

: true, 'entity

: 'sys/user' }


----------
### &laquo; `cmd:create_reset,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:load_reset,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:execute_reset,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:update,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:unlock,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:enable,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:activate,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:disable,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:deactivate,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:delete,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:remove,role:user` &raquo;

No description provided.



----------
### &laquo; `cmd:entity,role:user` &raquo;

No description provided.



----------
### &laquo; `get:user,role:user` &raquo;

No description provided.



----------
### &laquo; `init:user` &raquo;

No description provided.



----------


<!--END:action-desc-->

