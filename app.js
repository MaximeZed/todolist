// Dépendances native
const path = require('path')

// Dépendances 3rd party
const express = require('express')
    , bodyParser = require('body-parser')
    , sass = require('node-sass-middleware')
    , methodOverride = require('method-override')
    , session = require('express-session')
    , cookieParser = require('cookie-parser')
    , mongoose = require('mongoose')
    , autoIncrement = require('mongoose-auto-increment')

// Constantes et initialisations
const PORT = process.PORT || 8080
    , app = express()

// Initialisation des sessions
app.set('trust proxy', 1)
app.use(session({
  secret: 'TD T0D0 L15T',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

// Mise en place des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware pour parser le body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Method override
app.use(methodOverride('_method', {methods: ['GET', 'POST']}))

//Midelware cookie-parser
app.use(cookieParser())

// Préprocesseur sur les fichiers scss -> css
app.use(sass({
  src: path.join(__dirname, 'styles'),
  dest: path.join(__dirname, 'assets', 'css'),
  prefix: '/css',
  outputStyle: 'expanded'
}))

// On sert les fichiers statiques
app.use(express.static(path.join(__dirname, 'assets')))

// La liste des différents routeurs (dans l'ordre)
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))
app.use('/sessions', require('./routes/sessions'))
app.use('/todos', require('./routes/todos'))

// Erreur 404
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Gestion des erreurs
// Notez les 4 arguments !!
app.use(function(err, req, res, next) {
  // Les données de l'erreur
  let data = {
    message: err.message,
    status: err.status || 500
  }

  // En mode développement, on peut afficher les détails de l'erreur
  if (app.get('env') === 'development') {
    data.error = err.stack
  }

  // On set le status de la réponse
  res.status(data.status)

  // Réponse multi-format
  res.format({
    html: () => { res.render('error', data) },
    json: () => { res.send(data) }
  })
})

//Connexion à ma base données mongo
mongoose.connect('mongodb://localhost/nodeTodos');
mongoose.Promise = global.Promise;

var db = mongoose.connection;
autoIncrement.initialize(db)

db.on('error', console.error.bind(console, 'Erreur de connexion:'))
db.once('open', function() {

  console.log('DATABASE > Connexion ok!')
  app.listen(PORT, () => {
      console.log('APPLICATION > Serveur ok & port:', PORT)
  })
})
