const mongoose = require('mongoose')
    , autoIncrement = require('mongoose-auto-increment')


autoIncrement.initialize(mongoose.connection)

var todosSchema = mongoose.Schema({
  id: Number,
  authorId: Number,
  text: String,
  createdAt: Number,
  updatedAt: Number,
  completedAt: Number
})

todosSchema.plugin(autoIncrement.plugin,{
  model: 'todos',
  field: 'id',
  startAt: 1
})

var todos = mongoose.model('todos', todosSchema)


module.exports = {

  count: (id) => {

    return todos.find({'authorId': id }).count()
  },

  get: (todoId) => {

    return todos.findOne({'id': todoId })
  },

  getAll: (authorId, limit, offset) => {

    return todos.find({'authorId': authorId }).skip(offset).limit(limit)
  },

  insert: (authorId, params) => {

    result = new todos({
      authorId: authorId,
      text: params.text,
      createdAt: new Date().getTime(),
      updatedAt: null,
      completedAt: null
    })

    return result.save()
  },

  update: (todoId, params) => {
    const POSSIBLE_KEYS = ['text']

    let queryArgs = {}

    for (key in params) {
      if (~POSSIBLE_KEYS.indexOf(key)) {
        queryArgs[key] = params[key]
      }
    }

    queryArgs['updatedAt'] = Date.now()

    if (!queryArgs) {
      let err = new Error('Bad request')
      err.status = 400
      return Promise.reject(err)
    }

    return todos.update({id: todoId}, {$set: queryArgs}).exec()
  },

  remove: (id) => {

    return todos.find({'id': id}).remove().exec()
  },

  check: (todoId, completedAt) => {

    if (completedAt == 'null') {

      return todos.update({id: todoId}, {$set: {completedAt: new Date().getTime()}}).exec()
    }
    else {

      return todos.update({id: todoId}, {$set: {completedAt: null}}).exec()
    }
  }
}
