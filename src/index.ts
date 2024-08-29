import bodyParser from "body-parser"
import express from "express"
import "express-async-errors"
import config from "./config/index.js"
import { RP } from "./config/routes_prefix"
import "./database/index"
import { UserAuthenticationValidator } from "./middlewares/UserAuthenticationValidator.js"

import { router as AccountRouter } from "./routes/account-router.js"
import { router as AdminRouter } from "./routes/admin-router.js"
import { router as AuthRouter } from "./routes/auth-router.js"
import { router as MemoryRouter } from "./routes/memory-router.js"
import { router as ModeratorRouter } from "./routes/moderator-router.js"
import { router as MomentRouter } from "./routes/moment-router.js"
import { router as NotificationRouter } from "./routes/notification-router.js"
import { router as PreferencesRouter } from "./routes/preferences-router.js"
import { router as UserRouter } from "./routes/user-router.js"

const USER_PREFIX = RP.API_VERISON + RP.USER
const ACC_PREFIX = RP.API_VERISON + RP.ACCOUNT
const ADMIN_PREFIX = RP.API_VERISON + RP.ADMIN
const AUTH_PREFIX = RP.API_VERISON + RP.AUTH
const MEMORY_PREFIX = RP.API_VERISON + RP.MEMORY
const MODERATOR_PREFIX = RP.API_VERISON + RP.MODERATOR
const MOMENT_PREFIX = RP.API_VERISON + RP.MOMENT
const NOTIFICATION_PREFIX = RP.API_VERISON + RP.NOTIFICATION
const PREFERENCES_PREFIX = RP.API_VERISON + RP.PREFERENCES

if (config.RUN_SCRIPTS_MODE) RunScripts()

async function RunScripts() {}

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: "50mb" }))

app.use(AUTH_PREFIX, AuthRouter)
app.use(ADMIN_PREFIX, AdminRouter)
app.use(MODERATOR_PREFIX, ModeratorRouter)

app.use(USER_PREFIX, UserAuthenticationValidator, UserRouter)
app.use(ACC_PREFIX, UserAuthenticationValidator, AccountRouter)
app.use(MEMORY_PREFIX, UserAuthenticationValidator, MemoryRouter)
app.use(MOMENT_PREFIX, UserAuthenticationValidator, MomentRouter)
app.use(NOTIFICATION_PREFIX, UserAuthenticationValidator, NotificationRouter)
app.use(PREFERENCES_PREFIX, UserAuthenticationValidator, PreferencesRouter)

app.listen(config.PORT, () =>
    console.log("🚀 circle-system (server) - running on port: " + config.PORT)
)
