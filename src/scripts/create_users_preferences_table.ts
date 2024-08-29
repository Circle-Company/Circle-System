import Preference from "../models/preferences/preference-model.js"
import User from "../models/user/user-model.js"

export async function CreateUsersPreferences() {
    const allUsers = await User.findAll({ attributes: ["id"] })

    Promise.all(
        allUsers.map(async (user) => {
            console.log(user)
            const hasPreference = await Preference.findOne({ where: { user_id: user.id } })
            if (!hasPreference) {
                await Preference.create({ user_id: user.id })
                console.log("preference created with success")
            } else {
                console.log("already has preference")
            }
        })
    )
}