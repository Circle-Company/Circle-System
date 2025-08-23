import { NearController } from "@controllers/near"
import { Router } from "express"

export const router = Router()

router.post("/users", NearController.FindNearbyUsers)
