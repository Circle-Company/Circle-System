import Preference from "../../models/preference/preference-model"
import User from "../../models/user/user-model"

/**
 * Verifies and repairs the preferences of a specific user
 * @param userId User ID to check
 * @returns object indicating operation status
 */
export async function verifyAndRepairUserPreferences(userId: string | number | bigint) {
    try {
        // Verifies if the user exists
        const user = await User.findOne({ where: { id: userId } })
        if (!user) {
            return {
                success: false,
                message: `User with ID ${userId} not found.`,
            }
        }

        const preferences = await Preference.findOne({ where: { user_id: userId } })

        if (!preferences) {
            const newPreferences = await Preference.create({ user_id: userId })
            return {
                success: true,
                message: `Preferences successfully created for user ${userId}`,
                data: newPreferences,
            }
        }

        return {
            success: true,
            message: `User ${userId} already has configured preferences.`,
            data: preferences,
        }
    } catch (error: any) {
        console.error(`Error checking/repairing preferences for user ${userId}:`, error)
        return {
            success: false,
            message: `Error processing preferences: ${error.message || "Unknown error"}`,
            error,
        }
    }
}

/**
 * Checks all users without preferences and creates records for them
 * @returns operation result
 */
export async function repairAllMissingPreferences() {
    try {
        // Find all users
        const users = await User.findAll({
            attributes: ["id"],
            where: {
                deleted: false, // Optional: only non-deleted users
                blocked: false, // Optional: only non-blocked users
            },
        })

        // For each user, check if they have preferences
        const results = await Promise.all(
            users.map(async (user) => {
                const userId = user.id
                const preferences = await Preference.findOne({ where: { user_id: userId } })

                // If no preferences exist, create them
                if (!preferences) {
                    try {
                        await Preference.create({ user_id: userId })
                        return { userId, status: "repaired" }
                    } catch (error: any) {
                        return {
                            userId,
                            status: "error",
                            message: error.message || "Unknown error",
                        }
                    }
                }

                return { userId, status: "ok" }
            })
        )

        const fixed = results.filter((r) => r.status === "repaired").length
        const errors = results.filter((r) => r.status === "error").length
        const ok = results.filter((r) => r.status === "ok").length

        return {
            success: true,
            stats: {
                total: results.length,
                alreadyOk: ok,
                fixed: fixed,
                errors: errors,
            },
            details: results,
        }
    } catch (error: any) {
        console.error("Error repairing missing preferences:", error)
        return {
            success: false,
            message: `General error: ${error.message || "Unknown error"}`,
            error,
        }
    }
}
