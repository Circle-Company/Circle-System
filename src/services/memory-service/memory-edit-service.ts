import { InternalServerError, UnauthorizedError } from "../../errors/index.js"
import { Tag } from "../../helpers/tag/index.js"
import { StoreNewMemoryProps, StoreNewMemoryMomentProps, EditMemoryTitleProps} from "./types.js"
import Memory from '../../models/memories/memory-model.js'
import UserStatistic from '../../models/user/statistic-model.js'
import MemoryMoment from '../../models/memories/memory_moments-model.js'
import Statistic from '../../models/moments/moment_statistic-model.js'
import Metadata from '../../models/moments/moment_metadata-model.js'
import MomentMidia from '../../models/moments/moment_midia-model.js'
import Moment from '../../models/moments/moment-model.js'

export async function edit_memory_title ({ user_id, memory_id, title }: EditMemoryTitleProps) {
    try{
        const memory = await Memory.findOne({ where: {id: memory_id} })
        if(memory.user_id !== user_id) {throw new UnauthorizedError({
            message: 'you dont have authorization to edit this memory',
            action: 'Make shre you are the user who created the memory'
        })} else {
            await Memory.update({title}, { where: {id: memory_id}})
            return { message: 'memory title is edited with success'}
        }
    } catch(err: any) {
        throw new InternalServerError({ message: err.message })
    } 
}