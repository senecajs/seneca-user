const Seneca = require('seneca')

Seneca({ legacy: false })
  .test()
  .use('@seneca/entity')
  .use('..')
  .act('sys:user,register:user', {user:{email:'a@example.com'}}, Seneca.util.print)
  .act('sys:user,register:user', {user:{email:'b@example.com'}}, Seneca.util.print)
  .act('sys:user,register:user', {user:{email:'c@example.com'}}, Seneca.util.print)
  .ready(function() {
    this.close()
  })

