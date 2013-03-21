
var seneca = require('seneca')()
seneca.use( '..' )


seneca.ready(function(){

  var userpin = seneca.pin({role:'user',cmd:'*'})

  userpin.register( {name:"Flann O'Brien",email:'nincompoop@deselby.com',password:'blackair'}, function(err,out) {

    userpin.login({email:'nincompoop@deselby.com',password:'bicycle'}, function(err,out){
      console.log('login success: '+out.ok)

      userpin.login({email:'nincompoop@deselby.com',password:'blackair'}, function(err,out){
        console.log('login success: '+out.ok)
        console.log('login instance: '+out.login)
      })
    })
  })
})
