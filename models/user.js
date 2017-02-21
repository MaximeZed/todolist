const bcrypt = require('bcrypt-nodejs')
    , mongoose = require('mongoose')
    , autoIncrement = require('mongoose-auto-increment')


autoIncrement.initialize(mongoose.connection)

var usersSchema = mongoose.Schema({
  id: Number,
  pseudonyme: String,
  email: String,
  password: String,
  firstname: String,
  lastname: String,
  createdAt: Number,
  updatedAt: Number
})

usersSchema.plugin(autoIncrement.plugin,{
    model: 'users',
    field: 'id',
    startAt: 1
})

var users = mongoose.model('users', usersSchema)

module.exports = {
  get: (userId) => {
    return users.findOne({'id': userId })
  },

  count: () => {
    return users.count()
  },

  getAll: (limit, offset) => {
    return users.find().skip(offset).limit(limit)
  },

  getCurrentUser: (pseudonyme) => {

    return users.findOne({'pseudonyme': pseudonyme })
  },

  insert: (params) => {
    result = new users({
      pseudonyme: params.pseudonyme,
      email: params.email,
      password: bcrypt.hashSync(params.password),
      firstname: params.firstname,
      lastname: params.lastname,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime()
    })

    return result.save()
  },

  update: (userId, params) => {
   const POSSIBLE_KEYS = ['pseudonyme', 'email', 'password', 'firstname', 'lastname']

   let queryArgs = {}

   for (key in params) {
     if (~POSSIBLE_KEYS.indexOf(key)) {
       if (key === 'password') queryArgs[key] = bcrypt.hashSync(params[key])
       else queryArgs[key] = params[key]
     }
   }

   queryArgs['updatedAt'] = Date.now()

   if (!queryArgs) {
     let err = new Error('Bad request')
     err.status = 400
     return Promise.reject(err)
   }

   return users.update({id: userId}, {$set: queryArgs}).exec()
  },

  remove: (userId) => {
    return users.find({'id': userId}).remove().exec()
  }
}
