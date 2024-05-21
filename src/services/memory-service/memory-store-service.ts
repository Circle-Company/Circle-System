import { InternalServerError } from "../../errors"
import { Tag } from "../../helpers/tag"
import { StoreNewMemoryProps, StoreNewMemoryMomentProps} from "./types"
import Memory from '../../models/memories/memory-model.js'
import UserStatistic from '../../models/user/statistic-model.js'
import MemoryMoment from '../../models/memories/memory_moments-model.js'
import Statistic from '../../models/moments/moment_statistic-model.js'
import Metadata from '../../models/moments/moment_metadata-model.js'
import MomentMidia from '../../models/moments/moment_midia-model.js'
import Moment from '../../models/moments/moment-model.js'


export async function store_new_memory ({ user_id, title }: StoreNewMemoryProps) {
    try{

        await UserStatistic.increment('total_memories_num',{ by: 1, where: { user_id }})
        return await Memory.create({ user_id, title })
    } catch(err: any) {
        throw new InternalServerError({ message: err.message })
    } 
}

export async function store_new_memory_moment({ memory_id, moments_list}: StoreNewMemoryMomentProps) {
    try {
        await Promise.all(moments_list.map(async (moment) => {
            setTimeout(async() => {
                await MemoryMoment.create({ memory_id, moment_id: moment.id })
                await Memory.update({ updated_at: new Date() }, { where: { id: memory_id } })
            }, 100)

        }))
        return { message: 'moments have been successfully added to memory' }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    } 
}