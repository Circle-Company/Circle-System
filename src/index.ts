import express from 'express'
import http from 'http'
import 'express-async-errors'
import bodyParser from 'body-parser'
import './database/index.js'
import config from './config/index.js'
import {initializeSocket, getSocketInstance} from  './config/socket.js'

const authRouter = require('./routes/auth-router.js')
const userRouter = require('./routes/user-router.js')
const adminRouter = require('./routes/admin-router.js')
const accountRouter = require('./routes/account-router.js')
const moderatorRouter = require('./routes/moderator-router.js')
const NotificationRouter = require('./routes/notification-router.js')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(authRouter, userRouter, accountRouter, NotificationRouter)
app.use(adminRouter, moderatorRouter)

const server = http.createServer();
initializeSocket({server});
getSocketInstance().listen(3001)

app.listen(config.PORT, () => console.log("🚀 Server running on port: " + config.PORT))