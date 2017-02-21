const ioRedis = require('ioredis')
const redis = new ioRedis()

module.exports = {

  identification: (req, res, next) =>{

    if (req.accepts(['html', 'json']) == 'html') {

     if (req.cookies.accessToken == null){
       return res.redirect('/sessions')
     } else {
       module.exports.getCurrentSession(req.cookies.accessToken).then((result) => {
         var today = new Date().getTime()
         if (!result) {
           return res.redirect('/sessions')
         }
         else if ( result.expiresAt > today ) {
           return next()
         }
       }).catch(next)
     }
   } else {
     if (req.cookies.accessToken == null){
       let err = new Error('Merci de vous identifiez!')
       err.status = 400
       next(err)
     } else {
       return next()
     }
   }
  },

  getCurrentSession: (token) => {

    var params = []
    return redis.smembers('sessions').then((results) => {
      let pipeline = redis.pipeline()
      var onlineUsers = results
      var userId= ""
      for (var i in onlineUsers) {
          pipeline.hmget('session:'+onlineUsers[i],"userId", "accessToken", "createdAt", "expiresAt")
        }
        return pipeline.exec()
    }).then((res) => {
      for (var i in res)
      {
        let session = {
          userId: "",
          accessToken: "",
          createdAt: "",
          expiresAt: ""
        }
        attributeArray = res[i][1]
        if(token == attributeArray[1]){

          session. userId = attributeArray[0]
          session.accessToken = attributeArray[1]
          session.createdAt = attributeArray[2]
          session.expiresAt = attributeArray[3]
          return session
        }
      }
    })
  },

  insert: (params,token) => {

      let pipeline = redis.pipeline()

      pipeline.hmset(`session:${params.id}`, {userId:params.id, accessToken:token, createdAt:new Date().getTime(), expiresAt:new Date().getTime()+3600000}) // insert request
      pipeline.expire(`session:${params.id}`, 3600)
      pipeline.sadd('sessions', params.id)
      pipeline.expire(`sessions:${params.id}`, 3600)
      return pipeline.exec()
    },

    remove: (userId) => {

      let pipeline = redis.pipeline()
      pipeline.srem('sessions', userId)
      pipeline.del('session:'+userId)
      return pipeline.exec()
    }
  }
