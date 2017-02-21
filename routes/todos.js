const router = require('express').Router()
const Todo  = require('../models/todo')
const Session = require('../models/session')
const User = require('../models/user')

router.get('/', Session.identification, (req, res, next) => {
	console.log('- Route => Todos (GET)')

	let limit = parseInt(req.query.limit) || 20
	let offset = parseInt(req.query.offset) || 0

	if (limit < 1) limit = 1
	else if (limit > 100) limit = 100

	if (offset < 0) offset = 0

	Session.getCurrentSession(req.cookies.accessToken).then((currentSession) =>{

		if(!currentSession) {
			res.format({
				html: () => {

					res.redirect(301, '/sessions' )
				},
				json: () => {
					res.send({
						status: 'error',
						data: null
					})
				}
			})
		}
		else {

			User.get(currentSession.userId).then((currentUser) => {
				Promise.all([
					Todo.getAll(currentSession.userId, limit, offset),
					Todo.count(currentSession.userId),
				]).then((result) => {
					res.format({
						html: () => {
							res.render('todos/index', {
								title: 'Ma liste de todos',
								todos: result[0],
								count: result[1],
								limit: limit,
								offset: offset
							})
						},
						json: () => {
							res.send({
								data: {
									userTodos: result[0]
								},
								meta: {
									count: result[1].count,
									offset: offset,
									limit: limit
								}
							})
						}
					})
				}).catch(next)
			}).catch(next)
		}
	}).catch(next)
})


/* Todos : Get by id */
router.get('/:id(\\d+)', Session.identification, (req, res, next) => {
	console.log('- Route => Get todo by id')

	Todo.get(req.params.id).then((result) => {
        if(!result) return next()

        res.format({
            html: () => {
                res.render('todos/show', {
                    title: 'Info sur le todo',
                    todo: result
                })
            },
            json: () => {
                res.send({
                    status: 'success',
                    data: result,
                    message: null
                })
            }
        })
	}).catch(next)
})


/* Todos : Edit todo by id */
router.get('/:id(\\d+)/edit', Session.identification, (req, res, next) => {
	console.log('- Route => Edit user by id')
    res.format({
        html: () => {
					Todo.get(req.params.id).then((result) => {
                var sess = req.session
                res.render('todos/edit', {
                    title: "Editer le todo n°" + result.id ,
                    path: "/todos/"+req.params.id+"/?_method=PUT",
                    todo: result,
                    flash: sess.flash
                })
                sess.flash = {}
            }).catch(next)
        },
        json: () => {
            let err = new Error('Bad Request')
            err.status = 400
            next(err)
        }
    })
})

/* Todo : Add */
router.get('/add', Session.identification, (req, res, next) => {
	console.log('- Route => Add todo (GET)')
    res.format({
        html: () => {
            var sess = req.session
            res.render('todos/edit', {
                title: 'Ajout d\'un todo',
                path: '/todos',
                todo: {},
                flash: sess.flash
            })
            sess.flash = {}
        },
        json: () => {
            let err = new Error('Bad Request')
            err.status = 400
            next(err)
        }
    })
})


/* Todos : POST route */
router.post('/', Session.identification, (req, res, next) => {
  console.log('- Route => Todos (POST)')

  Session.getCurrentSession(req.cookies.accessToken).then((currentSession) =>{
    if(!currentSession) {

      res.format({
          html: () => {

              res.redirect(301, '/sessions' )
          },
          json: () => {
              res.send({
                  status: 'error',
                  data: null,
                  message: errorList
              })
          }
      })
    }
    else {

      Todo.insert(currentSession.userId, req.body).then((result) => {
          res.format({
              html: () => {
                  res.redirect(301, '/todos')
              },
              json: () => {
                  res.send({
                      status: 'success',
                      data: result,
                      message: null
                  })
              }
          })
      }).catch(next)
    }
  }).catch(next)
})

/* Todos : Update checked todos */
router.put('/:id(\\d+)/check/:completedAt', (req, res, next) => {
	console.log(`- Route => Update checked todos by id`)
  Todo.check(req.params.id, req.params.completedAt).then((result) => {
      res.format({
          html: () => {
              res.redirect(301, '/todos')
          },
          json: () => {
              res.send({
                  status: 'success',
                  data: result,
                  message: null
              })
          }
      })
  }).catch(next)
})


/* Todos : Update todo by id route */
router.put('/:id', Session.identification, (req, res, next) => {
	console.log(`- Route => Update todo by id`)

  Todo.update(req.params.id, req.body).then((result) => {
      res.format({
          html: () => {
              res.redirect(301, '/todos')
          },
          json: () => {
              res.send({
                  status: 'success',
                  data: result,
                  message: null
              })
          }
      })
  }).catch(next)
})


/* Todos : Delete todo by id route */
router.delete('/:id(\\d+)', Session.identification, (req, res, next) => {
	console.log('- Route => Delete todo by id')

	Todo.remove(req.params.id).then((result) => {
        res.format({
            html: () => {
                res.redirect(301, '/todos')
            },
            json: () => {
                res.set(`Content-Type`, 'application/json')
                res.send({
                    status: 'success',
                    data: result,
                    message: null
                })
            }
        })
	}).catch(next)
})

module.exports = router
