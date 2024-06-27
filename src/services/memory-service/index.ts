import { delete_memory, delete_memory_moment } from "./memory-delete-service";
import { edit_memory_title } from "./memory-edit-service";
import { find_memory, find_memory_moments, find_memory_moments_id, find_user_memories } from "./memory-find-service";
import { store_new_memory, store_new_memory_moment } from "./memory-store-service";

export const Memory = {
    Find: {
        Memory: find_memory,
        UserMemories: find_user_memories,
        Moments: find_memory_moments,
        MomentsIds: find_memory_moments_id
    },
    Store: {
        NewMemory: store_new_memory,
        NewMemoryMoment: store_new_memory_moment
    },
    Delete: {
        Memory: delete_memory,
        MemoryMoment: delete_memory_moment
    },
    Edit: {
        Title: edit_memory_title
    }
}