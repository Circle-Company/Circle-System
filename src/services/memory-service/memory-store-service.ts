import SecurityToolKit from "libs/security-tool/src"
import { InternalServerError, ValidationError } from "../../errors"
import Memory from "../../models/memories/memory-model"
import MemoryMoment from "../../models/memories/memory_moments-model"
import UserStatistic from "../../models/user/statistic-model"
import { TriggerNotification } from "../../notification-service"
import { StoreNewMemoryMomentProps, StoreNewMemoryProps } from "./types"

export async function store_new_memory({ user_id, title }: StoreNewMemoryProps) {
    try {
        await UserStatistic.increment("total_memories_num", { by: 1, where: { user_id } })
        const memory = await Memory.create({ user_id: user_id, title })

        if (!memory) throw new InternalServerError({ message: "Can't possible find this memory." })

        const sanitization = new SecurityToolKit().sanitizerMethods.sanitizeSQLInjection(title)

        if (sanitization.isDangerous) {
            throw new ValidationError({
                message:
                    "Characters that are considered malicious have been identified in the title.",
                action: 'Please remove characters like "]})*&',
            })
        }

        await TriggerNotification({
            notification: {
                type: "NEW-MEMORY",
                data: {
                    senderUserId: user_id,
                    memoryId: memory.id,
                },
            },
        })
        return {
            id: memory.id.toString(),
            title: sanitization.sanitized,
            user_id: memory.user_id.toString(),
            created_at: memory.created_at,
            updated_at: memory.updated_at,
        }
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
        // Check if memory exists
        const memoryExists = await Memory.findOne({ where: { id: memory_id } })
        if (!memoryExists) {
            throw new Error(`Memory with id ${memory_id} does not exist.`)
        }

        await Promise.all(
            moments_list.map(async (moment) => {
                setTimeout(async () => {
                    await MemoryMoment.create({
                        memory_id: BigInt(memory_id),
                        moment_id: BigInt(moment.id),
                    })
                    await Memory.update(
                        { updated_at: new Date() },
                        { where: { id: BigInt(memory_id) } }
                    )
                    await TriggerNotification({
                        notification: {
                            type: "ADD-TO-MEMORY",
                            data: {
                                senderUserId: BigInt(user_id),
                                momentId: BigInt(moment.id),
                            },
                        },
                    })
                }, 10)
            })
        )
        return { message: "moments have been successfully added to memory" }
    } catch (err: any) {
        console.log(err)
    }
}
