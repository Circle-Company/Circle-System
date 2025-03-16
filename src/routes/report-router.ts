import { RP } from "config/routes_prefix"
import { ReportController } from "controllers/report"
import { Router } from "express"

const PAGE_PREFIX = "/page"

export const router = Router()

router.get(PAGE_PREFIX + RP.ACCOUNT, ReportController.ReportAccount)
