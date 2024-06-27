import { Router } from 'express'
import { RP } from '../config/routes_prefix'
import { MemoryController } from '../controllers/memory'

const memoryRouter = Router()
const MEMORY_PREFIX = RP.API_VERISON + RP.MEMORY

//userRouter.use(UserAuthenticationValidator)
memoryRouter.post(MEMORY_PREFIX + '/get', MemoryController.FindMemory)
memoryRouter.post(MEMORY_PREFIX + '/get-user-memories', MemoryController.FindUserMemories)
memoryRouter.post(MEMORY_PREFIX + '/get-moments', MemoryController.FindMemoryMoments)
memoryRouter.post(MEMORY_PREFIX + '/get-moments-ids', MemoryController.FindMemoryMomentsIds)

memoryRouter.post(MEMORY_PREFIX + '/edit/title', MemoryController.EditMemoryTitle)

memoryRouter.post(MEMORY_PREFIX + '/create', MemoryController.StoreNewMemory)
memoryRouter.post(MEMORY_PREFIX + '/add-moment', MemoryController.StoreNewMemoryMoment)

memoryRouter.post(MEMORY_PREFIX + '/delete', MemoryController.DeleteMemory)
memoryRouter.post(MEMORY_PREFIX + '/remove-moment', MemoryController.DeleteMemoryMoment)
module.exports = memoryRouter