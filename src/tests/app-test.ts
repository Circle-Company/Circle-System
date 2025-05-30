import bodyParser from "body-parser"
import express from "express"
import "express-async-errors"
import { RP } from "../config/routes_prefix"
import { UserAuthenticationValidator } from "../middlewares/UserAuthenticationValidator"

import { router as AccountRouter } from "../routes/account-router"
import { router as AdminRouter } from "../routes/admin-router"
import { router as AuthRouter } from "../routes/auth-router"
import { router as MemoryRouter } from "../routes/memory-router"
import { router as ModeratorRouter } from "../routes/moderator-router"
import { router as MomentRouter } from "../routes/moment-router"
import { router as MomentRouterV2 } from "../routes/moment-router-v2"
import { router as NotificationRouter } from "../routes/notification-router"
import { router as PreferencesRouter } from "../routes/preferences-router"
import { router as UserRouter } from "../routes/user-router"

declare module "express-serve-static-core" {
    interface Request {
        user_id?: bigint
        ipAddress?: string
        username?: string
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
app.use(MOMENTS_PREFIX_V2, UserAuthenticationValidator, MomentRouterV2)
app.use(NOTIFICATION_PREFIX, UserAuthenticationValidator, NotificationRouter)
app.use(PREFERENCES_PREFIX, UserAuthenticationValidator, PreferencesRouter)

export const testBearerToken =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MjgxNDIwMDYyODk0ODU0MTQ0IiwidXNlcm5hbWUiOiJ0aWFnby5zYXZpb2xpIiwiaWF0IjoxNzM2MTkwNDg2LCJleHAiOjE3MzYxOTQwODYsImF1ZCI6IkNpcmNsZUFwcCIsImlzcyI6IkNpcmNsZUNvbXBhbnkifQ.SNOjvLXmswXiBTIzwkCuG0rCKGd8ajvLV_VhaNyOXfE"
export default app
