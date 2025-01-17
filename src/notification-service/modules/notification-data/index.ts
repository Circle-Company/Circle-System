import { InternalServerError } from "../../../errors"
import MomentMidia from "../../../models/moments/moment_midia-model.js"
import ProfilePicture from "../../../models/user/profilepicture-model"
import User from "../../../models/user/user-model"
import { NotificationProps } from "../../types"

type senderUserProps = {
    id: number
    username: string
    profile_picture: { fullhd_resolution: string }
}

type mediaProps = {
    nhd_resolution: string
}
type ModuleProps = {
    notification: NotificationProps
}

type ModuleReturnProps = {
    notificationData: {
        title: string
        body: string
        senderUser: senderUserProps
        media: mediaProps | null
        color: string
        priority: "min" | "low" | "default" | "high" | "max"
    }
}

export async function Module({ notification }: ModuleProps): Promise<ModuleReturnProps> {
    let title: string
    let body: string
    let priority: "min" | "low" | "default" | "high" | "max"
    let color: string
    let senderUser: senderUserProps
    let media: mediaProps | null

    const user: any = await User.findOne({
        where: { id: notification.data.senderUserId },
        attributes: ["id", "username"],
        include: [
            {
                model: ProfilePicture,
                as: "profile_pictures",
                attributes: ["fullhd_resolution"],
            },
        ],
    })

    if (!user)
        throw new InternalServerError({
            message: "Can´t possible find user to send notification.",
        })

    senderUser = {
        id: user.id,
        username: user.username,
        profile_picture: user.profile_pictures,
    }

    if (notification.type == "ADD-TO-MEMORY") {
        title = "New Moment✨"
        body = `see what @${user.username} is doing now... 👀`
        color = "#FF1975"
        priority = "high"
    } else if (notification.type == "FOLLOW-USER") {
        title = "New Follower"
        body = `@${user.username} is following you.`
        color = "#1977F3"
        priority = "default"
    } else if (notification.type == "NEW-MEMORY") {
        title = "New Memory"
        body = `see new @${user.username} memory... 😱`
        color = "#FF1975"
        priority = "high"
    } else if (notification.type == "LIKE-MOMENT") {
        title = "Moment Liked"
        body = `@${user.username} liked your moment.`
        color = "#FF1975"
        priority = "default"
    } else if (notification.type == "VIEW-USER") {
        title = "Profile View 👀"
        body = `@${user.username} viewed your profile now...`
        color = "#1977F3"
        priority = "default"
    } else {
        title = "New Notification"
        body = `View your account activity...`
        color = "#1977F3"
        priority = "default"
    }

    if (notification.type == "ADD-TO-MEMORY" || notification.type == "LIKE-MOMENT") {
        const momentMedia = await MomentMidia.findOne({
            where: { moment_id: notification.data.momentId },
            attributes: ["nhd_resolution"],
        })

        media = { nhd_resolution: momentMedia.nhd_resolution }
    } else media = null

    return {
        notificationData: {
            priority,
            color,
            title,
            body,
            senderUser,
            media,
        },
    }
}
