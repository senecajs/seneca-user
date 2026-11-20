# Changes

## 7.0.0 2026-11-20

Versions 6.0.0 to 6.4.0 have no entry here. They are on npm and in the
git history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3||>=4.0.0-rc2`). Seneca 3 users stay on `@seneca/user@6`.
* Node.js 24 or later (`engines.node` `>=24`, was `>=12`).
* The entity peer dependency is `@seneca/entity` `^29.0.0`. The peer
  dependency `seneca-entity` `>=26` is removed: npm installed
  seneca-entity 28 for it, and that version stops Seneca 4 at startup
  with `plugin_gubu_shape`.
* The peer dependency `seneca-promisify` is removed. Seneca 4 has
  `post`, `message` and promises built in, and deprecates the promisify
  plugin (D4). Do not load it.
* Option defaults (B13). Seneca 4 builds a closed shape from plain
  defaults, and it read the default arrays `handle.reserved` and
  `fields.standard` as fixed-length tuples: a longer list stopped the
  plugin with `invalid_plugin_option`, and a shorter or empty list was
  filled up from the default list. Both options now use `valid.Default`,
  so a list that you pass replaces the default list, as on Seneca 3, and
  must be an array of strings.
* `defaults` is now a function of `{ valid }`, the Seneca 4 form. Code
  that read `require('@seneca/user').defaults` as an object of default
  values must read the resolved options instead, for example
  `seneca.find_plugin('user').options`.
* Unknown option keys, top-level or nested, stop the plugin with
  `invalid_plugin_option`. Seneca 4 closes plain-object defaults;
  Seneca 3 ignored such keys.
* The password hasher stops its child process on `sys:seneca,cmd:close`
  instead of the deprecated `role:seneca,cmd:close` (D4). Password
  hashing, salts, pepper and tokens are unchanged.
* The package now ships `user-doc.js`. The `files` list named
  `user-docs.js`, which does not exist.
* README: install and quick example for Seneca 4 and `@seneca/entity`.
* Tests load `@seneca/entity` by its full name (B14), without
  `seneca-promisify` and `seneca-doc`. devDependencies: `seneca`
  `^4.0.0`, `@seneca/entity` `^29.0.0` and `seneca-msg-test` `^5.0.0`;
  `seneca-doc`, `coveralls` and `@seneca/maintain` are removed, and so
  is the `doc` script, which ran `seneca-doc`.
* `repository.url` uses `git+https`, and `publishConfig` sets public
  access. The Travis CI file is removed.


## 5.7.0 2020-05-08

* Update deps
* Support codeclimate


## 2.1.0 2016-08-25

* Updated dependencies
* Added Seneca 3 and Node 6 support
* Dropped Node 5 support


## 2.0.0 2016-08-16

* Brute force protection: lock account after few failed attempts PR#63
* Add active check on token in user, auth pattern PR#56
* Dropped support for Node 0.10, 0.12
* Updated dependencies


## 1.1.0 2016-07-22

* Adding password pepper option
* Updated dependencies
