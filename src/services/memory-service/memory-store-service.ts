import { InternalServerError } from "../../errors"
import Memory from "../../models/memories/memory-model.js"
import MemoryMoment from "../../models/memories/memory_moments-model.js"
import UserStatistic from "../../models/user/statistic-model.js"
import { TriggerNotification } from "../../notification-service"
import { StoreNewMemoryMomentProps, StoreNewMemoryProps } from "./types"

export async function store_new_memory({ user_id, title }: StoreNewMemoryProps) {
    try {
        await UserStatistic.increment("total_memories_num", { by: 1, where: { user_id } })
        const memory = await Memory.create({ user_id, title })
        await TriggerNotification({
            notification: {
                type: "NEW-MEMORY",
                data: {
                    senderUserId: user_id,
                    memoryId: memory.id,
                },
            },
        })
        return memory
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}

export async function store_new_memory_moment({
    memory_id,
    moments_list,
    user_id,
}: StoreNewMemoryMomentProps) {
    try {
        await Promise.all(
            moments_list.map(async (moment) => {
                setTimeout(async () => {
                    await MemoryMoment.create({ memory_id, moment_id: moment.id })
                    await Memory.update({ updated_at: new Date() }, { where: { id: memory_id } })
                    await TriggerNotification({
                        notification: {
                            type: "ADD-TO-MEMORY",
                            data: {
                                senderUserId: user_id,
                                momentId: moment.id,
                            },
                        },
                    })
                }, 10)
            })
        )
        return { message: "moments have been successfully added to memory" }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
