import { delete_memory, delete_memory_moment } from "./memory-delete-controller";
import { edit_memory_title } from "./memory-edit-controller";
import { find_memory, find_memory_moments, find_memory_moments_ids, find_user_memories } from "./memory-find-controller";
import { store_new_memory, store_new_memory_moment } from "./memory-store-controller";

export const MemoryController = {
    FindMemoryMoments: find_memory_moments,
    FindMemoryMomentsIds: find_memory_moments_ids,
    FindUserMemories: find_user_memories,
    FindMemory: find_memory,
    StoreNewMemory: store_new_memory,
    StoreNewMemoryMoment: store_new_memory_moment,
    DeleteMemory: delete_memory,
    DeleteMemoryMoment: delete_memory_moment,
    EditMemoryTitle: edit_memory_title
}