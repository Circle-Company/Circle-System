import { Router } from "express"
import { MemoryController } from "../controllers/memory"

export const router = Router()

router.post("/get", MemoryController.FindMemory)
router.post("/get-user-memories", MemoryController.FindUserMemories)
router.post("/get-moments", MemoryController.FindMemoryMoments)
router.post("/get-moments-ids", MemoryController.FindMemoryMomentsIds)

router.post("/edit/title", MemoryController.EditMemoryTitle)

router.post("/create", MemoryController.StoreNewMemory)
router.post("/add-moment", MemoryController.StoreNewMemoryMoment)

router.post("/delete", MemoryController.DeleteMemory)
router.post("/remove-moment", MemoryController.DeleteMemoryMoment)
