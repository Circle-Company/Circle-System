import { Request, Response } from "express"
import { ValidationError } from "../../errors"
import User from "../../models/user/user-model"
import ProfilePicture from "../../models/user/profilepicture-model"
import Statistic from "../../models/user/statistic-model"
import Coordinate from "../../models/user/coordinate-model"
import { Op, literal } from "sequelize"

/**
 * Applies security filtering to nearby users results
 * Removes users that should not be shown for security/privacy reasons
 */
function applySecurityFilter(users: any[]): any[] {
    return users
        .map(user => {
            // Obter dados do modelo Sequelize
            const userData = typeof user.get === 'function' ? user.get({ plain: true }) : user
            
            // Verificar se o usuário está deletado
            if (userData.deleted_at) {
                return null
            }
            
            // Retornar dados filtrados
            return {
                id: userData.id,
                username: userData.username,
                name: userData.name,
                profile_picture: userData.profile_pictures?.[0]?.url,
                statistic: {
                    followers_count: userData.statistics?.[0]?.followers_count || 0,
                    following_count: userData.statistics?.[0]?.following_count || 0,
                    posts_count: userData.statistics?.[0]?.posts_count || 0
                },
                distance_km: userData.distance_km || '0.00'
            }
        })
        .filter(user => user !== null)
}

export async function findNearbyUsers(req: Request, res: Response) {
    try {
        if (!req.user_id) {
            throw new ValidationError({
                message: "User ID is required to find nearby users.",
                action: "Make sure the user is authenticated and their ID is provided.",
            })
        }

        // Validate coordinates from body
        const { latitude, longitude, radius } = req.body

        if (!latitude || !longitude) {
            throw new ValidationError({
                message: "Coordinates are required to find nearby users.",
                action: "Provide latitude and longitude in the request body.",
            })
        }

        // Validate if coordinates are valid numbers
        const lat = parseFloat(latitude)
        const lng = parseFloat(longitude)

        if (isNaN(lat) || isNaN(lng)) {
            throw new ValidationError({
                message: "Invalid coordinates.",
                action: "Provide latitude and longitude as valid numbers.",
            })
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new ValidationError({
                message: "Coordinates out of valid range.",
                action: "Latitude must be between -90 and 90, longitude between -180 and 180.",
            })
        }

        // Validate and parse radius (in kilometers)
        let searchRadiusKm = radius ? parseFloat(radius) : 50 // Default 50km if not provided
        
        if (isNaN(searchRadiusKm) || searchRadiusKm <= 0) {
            throw new ValidationError({
                message: "Invalid search radius.",
                action: "Radius must be a positive number in kilometers.",
            })
        }
        
        // Limit maximum radius to 100km for performance reasons
        if (searchRadiusKm > 100) {
            searchRadiusKm = 100
        }

        // Get pagination parameters
        const limit = parseInt(req.query.limit as string, 10) || 10
        const page = parseInt(req.query.page as string, 10) || 1
        const offset = (page - 1) * limit

        // Find nearby users
        const nearbyUsers = await User.findAll({
            attributes: [
                'id',
                'username',
                'name',
                'deleted_at',
                [
                    literal(`'5.00'`),
                    'distance_km'
                ]
            ],
            include: [
                {
                    model: Coordinate,
                    as: 'coordinates',
                    required: true,
                    attributes: ['latitude', 'longitude']
                },
                {
                    model: ProfilePicture,
                    as: 'profile_pictures',
                    required: false,
                    attributes: ['url']
                },
                {
                    model: Statistic,
                    as: 'statistics',
                    required: false,
                    attributes: ['followers_count', 'following_count', 'posts_count']
                }
            ],
            where: {
                id: {
                    [Op.ne]: req.user_id
                }
            },
            limit,
            offset
        })

        // Count total users
        const total = await User.count({
            where: {
                id: {
                    [Op.ne]: req.user_id
                }
            }
        })

        // Apply security filter
        const users = applySecurityFilter(nearbyUsers)

        res.status(200).json({
            users,
            pagination: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error("Error finding nearby users:", error)

        if (error instanceof ValidationError) {
            return res.status(400).json({
                error: error.message
            })
        } else {
            return res.status(500).json({
                error: "An internal server error occurred while finding nearby users."
            })
        }
    }
} 