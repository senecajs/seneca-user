var Seneca = require('seneca')
var Basic = require('seneca-basic')
var Entity = require('seneca-entity')
var User = require('seneca-user')

var seneca = Seneca()
.use(Basic)
.use(Entity)
.use(User)

seneca.ready(() => {
  seneca.act({role: 'user', cmd: 'register', name: "Flann O'Brien", email: 'nincompoop@deselby.com', password: 'blackair'},
   (err, reply) => {
     if (err) {
       console.log('err: ', err)
       return
     }
     seneca.act({role: 'user', cmd: 'login', email: 'nincompoop@deselby.com', password: 'bicycle'}, (err, reply) => {
       if (err) {
         console.log('err: ', err)
         return
       }
       console.log('login success: ' + reply.ok)

       seneca.act({role: 'user', cmd: 'login', email: 'nincompoop@deselby.com', password: 'blackair'}, (err, reply) => {
         if (err) {
           console.log('err: ', err)
           return
         }
         console.log('login success: ' + reply.ok)
         console.log('login instance: ' + reply.login)
       })
     })
   })
})
