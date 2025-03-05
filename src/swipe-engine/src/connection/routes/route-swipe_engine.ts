import { Router } from "express"
import { SwipeEngine } from "../../.."

const swipeEngineRouter = Router()
swipeEngineRouter.post("/moments/get/feed", SwipeEngine.getMoments)
swipeEngineRouter.post("/moments/store/interaction", SwipeEngine.storeMomentInteraction)

export default swipeEngineRouter
