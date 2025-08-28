import "express-async-errors"
import "module-alias/register"
import "./database/index"

import { router as AccountRouter } from "@routes/account-router"
import { AdminAuthenticationValidator } from "./middlewares/AdminAuthenticationValidator"
import { router as AdminRouter } from "@routes/admin-router"
import { router as AuthRouter } from "@routes/auth-router"
import { router as MemoryRouter } from "@routes/memory-router"
import { router as ModeratorRouter } from "@routes/moderator-router"
import { router as MomentRouter } from "@routes/moment-router"
import { router as MomentRouterV2 } from "@routes/moment-router-v2"
import { router as NearRouter } from "@routes/near-router"
import { router as NotificationRouter } from "@routes/notification-router"
import { router as PreferencesRouter } from "@routes/preferences-router"
import { RP } from "./config/routes_prefix"
import { router as ReportRouter } from "@routes/report-router"
import { router as SwipeEngineMetricsRouter } from "@routes/swipe-engine-metrics-router"
import { UserAuthenticationValidator } from "./middlewares/UserAuthenticationValidator"
import { router as UserRouter } from "@routes/user-router"
import bodyParser from "body-parser"
import config from "./config/index"
import express from "express"

declare module "express-serve-static-core" {
    interface Request {
        user_id?: bigint
        ipAddress?: string
        username?: string
        admin_key?: string
        user?: Object
    }
}

const USER_PREFIX = RP.API_VERISON + RP.USER
const ACC_PREFIX = RP.API_VERISON + RP.ACCOUNT
const ADMIN_PREFIX = RP.API_VERISON + RP.ADMIN
const AUTH_PREFIX = RP.API_VERISON + RP.AUTH
const MEMORY_PREFIX = RP.API_VERISON + RP.MEMORY
const MODERATOR_PREFIX = RP.API_VERISON + RP.MODERATOR
const MOMENT_PREFIX = RP.API_VERISON + RP.MOMENT
const MOMENTS_PREFIX_V2 = RP.API_VERISON + RP.MOMENTS
const NOTIFICATION_PREFIX = RP.API_VERISON + RP.NOTIFICATION
const PREFERENCES_PREFIX = RP.API_VERISON + RP.PREFERENCES
const REPORT_PREFIX = RP.API_VERISON + RP.REPORT
const NEAR_PREFIX = RP.API_VERISON + RP.NEAR
const SWIPE_ENGINE_METRICS_PREFIX = RP.API_VERISON + RP.SWIPE_ENGINE + RP.METRICS
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ limit: "50mb" }))

app.use(AUTH_PREFIX, AuthRouter)
app.use(MODERATOR_PREFIX, ModeratorRouter)
app.use(REPORT_PREFIX, ReportRouter)

app.use(USER_PREFIX, UserAuthenticationValidator, UserRouter)
app.use(ACC_PREFIX, UserAuthenticationValidator, AccountRouter)
app.use(MEMORY_PREFIX, UserAuthenticationValidator, MemoryRouter)
app.use(MOMENT_PREFIX, UserAuthenticationValidator, MomentRouter)
app.use(MOMENTS_PREFIX_V2, UserAuthenticationValidator, MomentRouterV2)
app.use(NOTIFICATION_PREFIX, UserAuthenticationValidator, NotificationRouter)
app.use(PREFERENCES_PREFIX, UserAuthenticationValidator, PreferencesRouter)
app.use(NEAR_PREFIX, UserAuthenticationValidator, NearRouter)
app.use(SWIPE_ENGINE_METRICS_PREFIX, AdminAuthenticationValidator, SwipeEngineMetricsRouter)
app.use(ADMIN_PREFIX, AdminAuthenticationValidator, AdminRouter)

app.listen(config.PORT, async () => {
    console.log("🚀 circle-system (server) - running on port: " + config.PORT)
})

export default app
