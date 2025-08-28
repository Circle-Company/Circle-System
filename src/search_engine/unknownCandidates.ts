import { baseFunctions } from "./baseFunctions"
import { SearchEngine } from "./searchEngine"
import User from "@models/user/user-model"
import Coordinate from "@models/user/coordinate-model"
import Statistic from "@models/user/statistic-model"
import ProfilePicture from "@models/user/profilepicture-model"
import { FindedCandidatesProps } from "./src/types"
import { InternalServerError } from "@errors/index"
import UserSubscription from "@models/subscription/user-subscription-model"
import { Op } from "sequelize"

export class unknownCandidates extends baseFunctions {
    constructor(searchEngine: SearchEngine) {
        super(searchEngine)
    }

    private async find(): Promise<FindedCandidatesProps[]> {
        const [users, isPremium] = await Promise.all([
            User.findAll({
                attributes: ["id", "username", "verifyed", "muted", "name", "blocked"],
                where: {
                    ...this.filterSearchParams(),
                    id: {
                        [Op.not]: this.user.id,
                    },
                },
                include: [
                    {
                        model: Coordinate,
                        as: "coordinates",
                        attributes: ["latitude", "longitude"],
                    },
                    {
                        model: Statistic,
                        as: "statistics",
                        attributes: ["total_followers_num"],
                    },
                    {
                        model: ProfilePicture,
                        as: "profile_pictures",
                        attributes: ["tiny_resolution"],
                    },
                ],
                limit: this.rules.max_unknown_candidates,
            }),
            UserSubscription.findOne({
                where: { user_id: this.user.id },
                attributes: ["status"],
            }).then((userSubscriptionStatus) => {
                if (!userSubscriptionStatus)
                    throw new InternalServerError({
                        message: "Can´t possible find user subscription status.",
                    })
                if (userSubscriptionStatus.status === "active") return true
                return false
            }),
        ])

        return users.map((user) => ({
            user: {
                username: user.username,
                user_id: user.id,
            },
            weight: 0,
            is_premium: isPremium,
        }))
    }

    async process(): Promise<any[]> {
        const finded_candidates = await this.find()
        const hidrated_candidates = await this.hydratation.process(finded_candidates, "unknown")
        return this.rank(hidrated_candidates, "unknown")
    }
}
