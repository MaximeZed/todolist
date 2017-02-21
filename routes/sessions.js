const router = require('express').Router()
const User = require('../models/user')
const Session = require('../models/session')
const bcrypt = require('bcrypt-nodejs')

/* Sessions: GET route*/
router.get('/', (req, res, next) => {
	console.log('- Route => Sessions (GET)')
    res.format({
        html: () => {
            res.render('sessions/index', {
                title: 'Authentification'
            })
        },
        json: () => {
            let err = new Error('Bad Request')
            err.status = 400
            next(err)
        }
    })
})

/* Sessions: POST route */
router.post('/', (req, res, next) => {
    console.log('- Route => Sessions (POST)')
    if (
        !req.body.pseudonyme || req.body.pseudonyme == '' ||
        !req.body.password || req.body.password == ''
    ) {
        let err = new Error('Bad Request')
        err.status = 400
        return next(err)
    }


		User.getCurrentUser(req.body.pseudonyme).then((result) => {
		if(!result) {
	      let err = new Error('Bad Pseudonyme!')
	      err.status = 400
	      return next(err)
	  }
		bcrypt.compare(req.body.password, result.password, function(err, access) {
		  if(access == true){

				var token =''

				require('crypto').randomBytes(48, function(err, buffer) {
					token = buffer.toString('hex')

					Session.insert(result, token).then(() => {

				    res.format({
				        html: () => {

									res.cookie('accessToken', token, { maxAge: 3600000, httpOnly: true })
									res.redirect(301, '/todos')
				        },
				        json: () => {
									res.cookie('accessToken', token, { maxAge: 3600000, httpOnly: true })
									res.send({
										accessToken: token
									})
				        }
				    })
					}).catch(next)
				})
		  }else {
				let err = new Error('Mauvais pseudo ou mots de passe!')
	      err.status = 400
	      return next(err)
		  }
		})
	}).catch(next)
})

/* Sessions: DELETE route */
router.delete('/', (req, res, next) => {
	var userId = parseInt(req.body.userId)

	if(
		!userId || userId == 0
	)
	{
      let err = new Error('Bad Request')
      err.status = 400
      return next(err)
  }
	Session.remove(userId).then((result) =>{

 		res.format({
 			html: () => {
 				res.redirect(301, '/users') },
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
