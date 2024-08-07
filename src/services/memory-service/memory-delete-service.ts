import { InternalServerError, UnauthorizedError} from "../../errors"
import { Tag } from "../../helpers/tag"
import { DeleteMemoryProps, DeleteMemoryMomentProps} from "./types"
import Memory from '../../models/memories/memory-model.js'
import MemoryMoment from '../../models/memories/memory_moments-model.js'
import UserStatistic from '../../models/user/statistic-model.js'
import Statistic from '../../models/moments/moment_statistic-model.js'
import Metadata from '../../models/moments/moment_metadata-model.js'
import MomentMidia from '../../models/moments/moment_midia-model.js'
import Moment from '../../models/moments/moment-model.js'

export async function delete_memory ({ memory_id, user_id }: DeleteMemoryProps) {
    try{
        const memory = await Memory.findOne({ where: {id: memory_id}})
        if(memory.user_id == user_id) {
            await Memory.destroy({ where: {id: memory_id}})
            await UserStatistic.increment('total_memories_num',{ by: -1, where: { user_id }})
            return {message: 'memory have been successfully deleted'}
        } else {
            throw new InternalServerError({
                message: 'This user is not the owner of this memory',
                action: 'Make sure this user owns the memory to delete it'
            })
        }
    } catch(err: any) {
        throw new InternalServerError({ message: err.message })
    } 
}

export async function delete_memory_moment({ memory_id, moment_id, user_id}: DeleteMemoryMomentProps) {
    try {
        const moment = await Moment.findOne({ where: {user_id}})
        const memory = await Memory.findOne({ where: {user_id}})

        if(!moment) throw new UnauthorizedError({
            message: 'This user is not the owner of this moment',
            action: 'Make sure this user owns the moment to delete from memory'
        })
        else if(!memory)throw new UnauthorizedError({
            message: 'This user is not the owner of this memory',
            action: 'Make sure this user owns the memory to delete it'
        })
        else {
            await MemoryMoment.destroy({ where: {memory_id, moment_id }})
            const memory_moments = await MemoryMoment.findAll({ where: {memory_id} })
            if(memory_moments.length == 0){
                await Memory.destroy({ where: {id: memory_id}})
                await UserStatistic.increment('total_memories_num',{ by: -1, where: { user_id }})
            }
            return { message: 'moment have been successfully deleted from memory' }            
        }

    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    } 
}