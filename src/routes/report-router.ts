import { RP } from "../config/routes_prefix"
import { ReportController } from "@controllers/report"
import { Router } from "express"
import { reportAccount } from "@controllers/report/report-actions-controller"

const PAGE_PREFIX = "/page"

export const router = Router()

// Página de denúncia de conta
router.get(PAGE_PREFIX + RP.ACCOUNT, ReportController.ReportAccount)

// API de denúncia de conta (integração com o formulário)
router.post(RP.API_VERISON + RP.REPORT + "/account", reportAccount)
