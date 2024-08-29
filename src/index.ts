import bodyParser from "body-parser"
import express from "express"
import "express-async-errors"
import config from "./config/index.js"
import "./database/index"

const authRouter = require("./routes/auth-router")
const userRouter = require("./routes/user-router")
const momentRouter = require("./routes/moment-router")
const memoryRouter = require("./routes/memory-router")
const adminRouter = require("./routes/admin-router")
const accountRouter = require("./routes/account-router")
const moderatorRouter = require("./routes/moderator-router")
const NotificationRouter = require("./routes/notification-router")
const PreferencesRouter = require("./routes/preferences-router")

if (config.RUN_SCRIPTS_MODE) RunScripts()

async function RunScripts() {}

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: "50mb" }))
app.use(
    authRouter,
    userRouter,
    accountRouter,
    NotificationRouter,
    momentRouter,
    memoryRouter,
    PreferencesRouter
)
app.use(adminRouter, moderatorRouter)

/**
 * 
const server = http.createServer();
initializeSocket({server});
getSocketInstance().listen(config.SOCKET_PORT)

 */

app.listen(config.PORT, () =>
    console.log("🚀 circle-system (server) - running on port: " + config.PORT)
)
