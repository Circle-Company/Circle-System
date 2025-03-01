import { InternalServerError, UnauthorizedError } from "../../errors"
import Memory from "../../models/memories/memory-model"
import { EditMemoryTitleProps } from "./types"

export async function edit_memory_title({ user_id, memory_id, title }: EditMemoryTitleProps) {
    try {
        const memory = await Memory.findOne({ where: { id: memory_id.toString() } })

        if (!memory) throw new InternalServerError({ message: "Can't possible find this memory." })

        if (memory.user_id.toString() !== user_id.toString()) {
            throw new UnauthorizedError({
                message: "you dont have authorization to edit this memory",
                action: "Make shre you are the user who created the memory",
            })
        } else {
            await Memory.update({ title }, { where: { id: memory_id.toString() } })
            return { message: "memory title is edited with success" }
        }
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}
