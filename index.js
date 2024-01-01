require('reflect-metadata')

var express = require('express')
var path = require('path')
var logger = require('morgan')
var bodyParser = require('body-parser')
var neo4j = require('neo4j-driver')
var { graphqlHTTP } = require("express-graphql")
var { buildSchema } = require("graphql")

var app = express()

const port = process.env.PORT || 3000

var schema = buildSchema(`
  type Query {
    user: 
  }
`)
var root = {
    hello: 'oieeee'
  }

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use(
    "/graphql",
    graphqlHTTP({
      schema: schema,
      rootValue: root,
      graphiql: true,
    })
)

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'marvel99'))
var session = driver.session()

app.get('/', function(req, res) {
    session
    .run('MATCH(n:Movie) RETURN n LIMIT 100')
    .then(function(result) {
        result.records.forEach(function(record) {
            console.log(record)
        })
    })
    .catch(function(err){
        console.log(err)
    })
    res.send('working')
})

app.listen(port, () => console.log('server running on port: ' + port))