import { InternalServerError, UnauthorizedError } from "../../errors"
import Memory from "../../models/memories/memory-model"
import MemoryMoment from "../../models/memories/memory_moments-model"
import Moment from "../../models/moments/moment-model"
import UserStatistic from "../../models/user/statistic-model"
import { DeleteMemoryMomentProps, DeleteMemoryProps } from "./types"

export async function delete_memory({ memory_id, user_id }: DeleteMemoryProps) {
    try {
        const memory = await Memory.findOne({ where: { id: memory_id.toString() } })

        if (!memory) throw new InternalServerError({ message: "Can't possible find this memory." })

        if (memory.user_id.toString() == user_id.toString()) {
            await Memory.destroy({ where: { id: memory_id.toString() } })
            await UserStatistic.increment("total_memories_num", { by: -1, where: { user_id } })
            return { message: "memory have been successfully deleted" }
        } else {
            throw new InternalServerError({
                message: "This user is not the owner of this memory",
                action: "Make sure this user owns the memory to delete it",
            })
        }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}

export async function delete_memory_moment({
    memory_id,
    moment_id,
    user_id,
}: DeleteMemoryMomentProps) {
    try {
        const moment = await Moment.findOne({ where: { user_id: user_id.toString() } })
        const memory = await Memory.findOne({ where: { user_id: user_id.toString() } })

        if (!moment)
            throw new UnauthorizedError({
                message: "This user is not the owner of this moment",
                action: "Make sure this user owns the moment to delete from memory",
            })
        if (!memory)
            throw new UnauthorizedError({
                message: "This user is not the owner of this memory",
                action: "Make sure this user owns the memory to delete it",
            })
        else {
            await MemoryMoment.destroy({
                where: { memory_id: memory_id.toString(), moment_id: moment_id.toString() },
            })
            const memory_moments = await MemoryMoment.findAll({
                where: { memory_id: memory_id.toString() },
            })
            if (memory_moments.length == 0) {
                await Memory.destroy({ where: { id: memory_id.toString() } })
                await UserStatistic.increment("total_memories_num", { by: -1, where: { user_id } })
            }
            return { message: "moment have been successfully deleted from memory" }
        }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
