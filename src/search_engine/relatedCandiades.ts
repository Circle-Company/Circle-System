import { InternalServerError } from "@errors/index"
import UserSubscription from "@models/subscription/user-subscription-model"
import Relation from "@models/user/relation-model"
import User from "@models/user/user-model"
import { FindedCandidatesProps, RelatedUserProps, RelationProps } from "./src/types"
import { baseFunctions } from "./baseFunctions"
import { SearchEngine } from "./searchEngine"
import { Op } from "sequelize"

export class relatedCandidates extends baseFunctions {
    constructor(searchEngine: SearchEngine) {
        super(searchEngine)
    }

    private async find(): Promise<FindedCandidatesProps[]> {
        try {
            const relations = (await Relation.findAll({
                attributes: ["related_user_id", "weight"],
                limit: this.rules.max_related_candidates,
                order: [["weight", "DESC"]],
                where: {
                    user_id: this.user.id,
                    weight: {
                        [Op.gte]: this.rules.min_relation_weight,
                    },
                    related_user_id: {
                        [Op.not]: this.user.id,
                    },
                },
            })) as RelationProps[]

            return Promise.all(
                relations.map(async (relation) => {
                    const [user, isPremium] = await Promise.all([
                        User.findOne({
                            attributes: ["id", "username"],
                            where: { id: relation.related_user_id },
                        }).then((user) => {
                            if (!user)
                                throw new InternalServerError({
                                    message: "Can´t possible find related user.",
                                })
                            return {
                                username: user.username,
                                user_id: user.id,
                            }
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

                    if (user.username.includes(this.searchTerm)) {
                        return {
                            user,
                            weight: relation.weight,
                            is_premium: isPremium,
                        }
                    }

                    return null
                })
            ).then((candidates) => candidates.filter((candidate) => candidate !== null))
        } catch (error) {
            console.error("Error in find_search_candidates:", error)
            throw error
        }
    }

    private filter(candidates: FindedCandidatesProps[]) {
        const idsSet = new Set<bigint>()
        const uniqueUsers: RelatedUserProps[] = []

        // Remove usuários duplicados
        for (const user of candidates) {
            if (!idsSet.has(user.user.user_id)) {
                idsSet.add(user.user.user_id)
                uniqueUsers.push(user)
            }
        }

        let candidates_without_duplication = uniqueUsers
        let filtered_premium_candidates = candidates_without_duplication.filter(
            (item) => item.is_premium
        )
        let filtered_non_premium_candidates = candidates_without_duplication.filter(
            (item) => !item.is_premium
        )

        if (filtered_premium_candidates.length > this.rules.max_premium_users) {
            const top_premium_candidates = filtered_premium_candidates.sort(
                (a, b) => b.weight - a.weight
            )
            filtered_premium_candidates = top_premium_candidates.slice(
                0,
                this.rules.max_premium_users
            )
        }

        const filtered_candidates = [
            ...filtered_premium_candidates,
            ...filtered_non_premium_candidates,
        ]
        const sorted_filtered_candidates = filtered_candidates.sort((a, b) => b.weight - a.weight)
        const filtered_candidates_with_search_term = sorted_filtered_candidates.filter((item) =>
            item.user.username.includes(this.searchTerm)
        )

        return filtered_candidates_with_search_term.slice(0, this.rules.max_results_per_page)
    }

    async process() {
        const finded_candidates = await this.find()
        const filtered_candidates = this.filter(finded_candidates)
        const hidrated_candidates = await this.hydratation.process(filtered_candidates, "related")
        return this.rank(hidrated_candidates, "related")
    }
}
