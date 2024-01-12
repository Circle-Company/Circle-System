import express from 'express'
import 'express-async-errors'
import bodyParser from 'body-parser'
import './database/index.js'
import config from './config/index.js'

const authRouter = require('./routes/auth-router.js')
const userRouter = require('./routes/user-router.js')
const adminRouter = require('./routes/admin-router.js')
const accountRouter = require('./routes/account-router.js')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(authRouter, adminRouter, userRouter, accountRouter)

app.listen(config.PORT, () => console.log("🚀 Server running on port: " + config.PORT))