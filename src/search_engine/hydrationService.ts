import User from "@models/user/user-model"
import ProfilePicture from "@models/user/profilepicture-model"
import Statistic from "@models/user/statistic-model"
import Coordinate from "@models/user/coordinate-model"
import { InternalServerError } from "@errors/index"
import { FindedCandidatesProps } from "./src/types"
import { findUserFollow } from "./src/functions/set_interactions/find_user_follow"
import { FinduserBlock } from "./src/functions/set_interactions/find_user_block"
import { Coordinates, haversineDistance } from "../helpers/coordinates_distance"

interface HydrationConfig {
    batchSize: number
    maxConcurrentBatches: number
}

interface HydratedUser {
    id: bigint
    username: string
    verifyed: boolean
    name: string
    muted: boolean
    blocked: boolean
    you_follow: boolean
    profile_picture: {
        tiny_resolution: string
    }
    statistic: {
        total_followers_num: number
    }
    is_premium: boolean
    weight: number
    // Campos específicos para unknown candidates
    follow_you?: boolean
    you_block?: boolean
    block_you?: boolean
    distance?: number | null
}

export class HydrationService {
    private readonly config: HydrationConfig
    private readonly findFollow: (userId: string) => Promise<boolean>
    private readonly finderUserId: bigint

    constructor(
        findFollow: (userId: string) => Promise<boolean>,
        finderUserId: bigint,
        config: HydrationConfig
    ) {
        this.findFollow = findFollow
        this.finderUserId = finderUserId
        this.config = config
    }

    /**
     * Hydrates candidates in optimized batches for maximum performance
     */
    async process(
        candidates: FindedCandidatesProps[],
        type: "related" | "unknown"
    ): Promise<HydratedUser[]> {
        if (candidates.length === 0) {
            return []
        }

        console.log(
            `🚀 Starting ${type} hydration of ${candidates.length} candidates with batch size ${this.config.batchSize}`
        )
        const startTime = Date.now()

        try {
            // Split candidates into batches
            const batches = this.createBatches(candidates)
            console.log(`📦 Created ${batches.length} batches`)

            // Process batches with controlled concurrency
            const batchResults = await this.processBatchesWithConcurrency(batches, type)

            // Flatten and filter results
            const allResults = batchResults.flat().filter((user) => user !== null)

            const duration = Date.now() - startTime
            console.log(
                `✅ ${type} hydration completed: ${allResults.length} users in ${duration}ms`
            )

            return allResults
        } catch (error) {
            console.error(`❌ ${type} hydration failed:`, error)
            throw error
        }
    }

    /**
     * Creates optimized batches from candidates
     */
    private createBatches(candidates: FindedCandidatesProps[]): FindedCandidatesProps[][] {
        const batches: FindedCandidatesProps[][] = []

        for (let i = 0; i < candidates.length; i += this.config.batchSize) {
            batches.push(candidates.slice(i, i + this.config.batchSize))
        }

        return batches
    }

    /**
     * Processes batches with controlled concurrency to avoid database overload
     */
    private async processBatchesWithConcurrency(
        batches: FindedCandidatesProps[][],
        type: "related" | "unknown"
    ): Promise<HydratedUser[][]> {
        const results: HydratedUser[][] = []

        // Process batches in chunks to control concurrency
        for (let i = 0; i < batches.length; i += this.config.maxConcurrentBatches) {
            const batchChunk = batches.slice(i, i + this.config.maxConcurrentBatches)

            console.log(
                `🔄 Processing ${type} batch chunk ${
                    Math.floor(i / this.config.maxConcurrentBatches) + 1
                }/${Math.ceil(batches.length / this.config.maxConcurrentBatches)}`
            )

            const chunkResults = await Promise.all(
                batchChunk.map((batch) => this.processBatch(batch, type))
            )

            results.push(...chunkResults)
        }

        return results
    }

    /**
     * Processes a single batch of candidates
     */
    private async processBatch(
        batch: FindedCandidatesProps[],
        type: "related" | "unknown"
    ): Promise<HydratedUser[]> {
        try {
            if (type === "unknown") {
                return await this.processUnknownCandidatesBatch(batch)
            } else {
                return await this.processRelatedCandidatesBatch(batch)
            }
        } catch (error) {
            console.error(`❌ ${type} batch processing failed:`, error)
            throw error
        }
    }

    /**
     * Processes related candidates batch (original logic)
     */
    private async processRelatedCandidatesBatch(
        batch: FindedCandidatesProps[]
    ): Promise<HydratedUser[]> {
        // Parallel database queries for all users in batch
        const userPromises = batch.map((candidate) =>
            User.findOne({
                attributes: ["id", "username", "verifyed", "muted", "blocked", "name"],
                where: { id: candidate.user.user_id },
                include: [
                    {
                        model: ProfilePicture,
                        as: "profile_pictures",
                        attributes: ["tiny_resolution"],
                    },
                    {
                        model: Statistic,
                        as: "statistics",
                        attributes: ["total_followers_num"],
                    },
                ],
            })
        )

        const users = (await Promise.all(userPromises)) as any[]

        // Parallel follow status checks
        const followPromises = users.map((user, index) => {
            if (!user) {
                throw new InternalServerError({
                    message: `Can't find candidate user with ID: ${batch[index].user.user_id}`,
                })
            }
            return this.findFollow(user.id.toString())
        })

        const followStatuses = await Promise.all(followPromises)

        // Combine results
        return users
            .map((user, index) => {
                if (!user) return null

                return {
                    id: user.id,
                    username: user.username,
                    verifyed: user.verifyed || false,
                    name: user.name || "",
                    muted: user.muted || false,
                    blocked: user.blocked || false,
                    you_follow: followStatuses[index],
                    profile_picture: {
                        tiny_resolution: user.profile_pictures?.tiny_resolution || "",
                    },
                    statistic: user.statistics || { total_followers_num: 0 },
                    is_premium: batch[index].is_premium,
                    weight: batch[index].weight,
                }
            })
            .filter((user) => user !== null) as HydratedUser[]
    }

    /**
     * Processes unknown candidates batch with coordinates and distance calculation
     */
    private async processUnknownCandidatesBatch(
        batch: FindedCandidatesProps[]
    ): Promise<HydratedUser[]> {
        // Get finder user coordinates
        const user_coords = await Coordinate.findOne({
            attributes: ["user_id", "latitude", "longitude"],
            where: { user_id: this.finderUserId.toString() },
        })

        if (!user_coords) {
            throw new InternalServerError({ message: "Error to find user coordinates." })
        }

        return await Promise.all(
            batch.map(async (candidate) => {
                // Get candidate user data with coordinates
                const candidateUser = await User.findOne({
                    attributes: ["id", "username", "verifyed", "muted", "blocked", "name"],
                    where: { id: candidate.user.user_id },
                    include: [
                        {
                            model: Coordinate,
                            as: "coordinates",
                            attributes: ["latitude", "longitude"],
                        },
                        {
                            model: ProfilePicture,
                            as: "profile_pictures",
                            attributes: ["tiny_resolution"],
                        },
                        {
                            model: Statistic,
                            as: "statistics",
                            attributes: ["total_followers_num"],
                        },
                    ],
                })

                if (!candidateUser) {
                    throw new InternalServerError({
                        message: `Can't find candidate user with ID: ${candidate.user.user_id}`,
                    })
                }

                const user_coords_class = new Coordinates(
                    user_coords.latitude,
                    user_coords.longitude
                )
                const candidate_coords_class = new Coordinates(
                    (candidateUser as any).coordinates.latitude,
                    (candidateUser as any).coordinates.longitude
                )

                const [follow_you, you_block, block_you] = await Promise.all([
                    findUserFollow({
                        user_id: candidate.user.user_id,
                        followed_user_id: this.finderUserId,
                    }),
                    FinduserBlock({
                        user_id: this.finderUserId,
                        blocked_user_id: candidate.user.user_id,
                    }),
                    FinduserBlock({
                        user_id: candidate.user.user_id,
                        blocked_user_id: this.finderUserId,
                    }),
                ])

                return {
                    id: candidateUser.id,
                    username: candidateUser.username,
                    verifyed: candidateUser.verifyed || false,
                    name: candidateUser.name || "",
                    muted: candidateUser.muted || false,
                    blocked: candidateUser.blocked || false,
                    you_follow: false, // Para unknown candidates
                    profile_picture: {
                        tiny_resolution:
                            (candidateUser as any).profile_pictures?.tiny_resolution || "",
                    },
                    statistic: (candidateUser as any).statistics || { total_followers_num: 0 },
                    is_premium: candidate.is_premium,
                    weight: candidate.weight,
                    // Campos específicos para unknown candidates
                    follow_you: Boolean(follow_you),
                    you_block: Boolean(you_block),
                    block_you: Boolean(block_you),
                    distance: haversineDistance(user_coords_class, candidate_coords_class),
                }
            })
        )
    }
}
