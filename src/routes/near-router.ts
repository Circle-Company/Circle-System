import { Router } from "express"
import { NearController } from "@controllers/near"

export const router = Router()

router.get("/users/find", NearController.FindNearbyUsers)
