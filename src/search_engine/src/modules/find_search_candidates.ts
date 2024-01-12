import {FindSearchCandidatesProps} from "../types"
import { filterSearchParams } from "../functions/filter_search_params"

const User = require('../../../models/user/user-model.js')
const ProfilePicture = require('../../../models/user/profilepicture-model.js')
const Statistic = require('../../../models/user/statistic-model.js')
const Coordinate = require('../../../models/user/coordinate-model.js')

/**
 * Finds search candidates based on the provided criteria.
 * @param {FindSearchCandidatesProps} params - Parameters for the search operation.
 * @returns {Promise<Object>} - A Promise that resolves to the search results.
 */
export async function find_search_candidates({
    user_id,
    username_to_search,
}: FindSearchCandidatesProps): Promise<Object> {
    try {
        // Apply security layer to filter valid search parameters
        const searchParams = filterSearchParams({ user_id, username_to_search });

        // Retrieve user coordinates using Sequelize findOne
        const user_coordinates = await Coordinate.findOne({
            attributes: ['latitude', 'longitude'],
            where: { user_id },
        });

        // Find users with matching username and additional criteria using Sequelize findAll
        const users = await User.findAll({
            attributes: ['id', 'username', 'verifyed', 'name', 'muted'],
            where: searchParams,
            include: [
                {
                    model: Coordinate,
                    as: 'coordinates',
                    attributes: ['latitude', 'longitude'],
                },
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    attributes: ['fullhd_resolution', 'tiny_resolution'],
                },
                {
                    model: Statistic,
                    as: 'statistics',
                    attributes: ['total_followers_num'],
                },
            ],
            limit: 20, // Limit the number of results to 20
        });

        // Return the search results in a structured object
        return {
            users,
            user_coordinates,
            user_id,
        };
    } catch (error) {
        // Handle errors gracefully and log them
        console.error("Error in find_search_candidates:", error);
        throw error; // Rethrow the error to be caught by the calling function
    }
}