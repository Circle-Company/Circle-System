import Follow from "@models/user/follow-model"
import Block from "@models/user/block-model"
import Security from "security-toolkit"
import { SearchEngine } from "./searchEngine"
import { HydrationService } from "./hydrationService"
import sequelize, { Op } from "sequelize"
import { CalculeDistanceProps } from "./src/types"
import { Coordinates, haversineDistance } from "../helpers/coordinates_distance"

// Adicione estas interfaces no início do arquivo
enum ValidationError {
    INVALID_TYPE = "INVALID_TYPE",
    EMPTY_TERM = "EMPTY_TERM",
    TOO_SHORT = "TOO_SHORT",
    TOO_LONG = "TOO_LONG",
    SECURITY_THREAT = "SECURITY_THREAT",
    INVALID_CHARACTERS = "INVALID_CHARACTERS",
    VALIDATION_ERROR = "VALIDATION_ERROR",
}

interface ValidationResult {
    isValid: boolean
    error: ValidationError | null
    message: string
    code: string
    details?: {
        currentLength?: number
        minimumLength?: number
        maximumLength?: number
        normalizedTerm?: string
        originalLength?: number
        normalizedLength?: number
        threatLevel?: string
        detectedPatterns?: string[]
        errorId?: string
        timestamp?: string
    }
}

export class baseFunctions extends SearchEngine {
    public readonly security: Security
    public readonly hydratation: HydrationService

    constructor(searchEngine: SearchEngine) {
        super(searchEngine)
        this.security = new Security()
        this.hydratation = new HydrationService(this.findFollow, BigInt(this.user.id), {
            batchSize: this.rules.batch_size,
            maxConcurrentBatches: this.rules.max_concurrent_batches,
        })
    }

    public async findFollow(followed_user_id: string) {
        const user_followed = await Follow.findOne({
            attributes: ["followed_user_id", "user_id"],
            where: { followed_user_id, user_id: this.user.id },
        })

        return Boolean(user_followed)
    }

    public async findBlocked(blocked_user_id: string) {
        const user_blocked = await Block.findOne({
            attributes: ["blocked_user_id", "user_id"],
            where: { blocked_user_id, user_id: this.user.id },
        })
        return Boolean(user_blocked)
    }

    /**
     * Validates search term according to security and business rules
     * @returns ValidationResult with detailed information about validation status
     */
    public isValidSearchTerm(): ValidationResult {
        try {
            // Type validation
            if (typeof this.searchTerm !== "string") {
                return {
                    isValid: false,
                    error: ValidationError.INVALID_TYPE,
                    message: "Search term must be a string",
                    code: "SEARCH_INVALID_TYPE",
                }
            }

            // Normalize search term
            const normalizedTerm = this.searchTerm.trim()

            // Empty string validation
            if (normalizedTerm === "") {
                return {
                    isValid: false,
                    error: ValidationError.EMPTY_TERM,
                    message: "Search term cannot be empty or contain only whitespace",
                    code: "SEARCH_EMPTY_TERM",
                }
            }

            // Length validation
            if (normalizedTerm.length < this.rules.min_search_length) {
                return {
                    isValid: false,
                    error: ValidationError.TOO_SHORT,
                    message: `Search term must be at least ${this.rules.min_search_length} character(s)`,
                    code: "SEARCH_TOO_SHORT",
                    details: {
                        currentLength: normalizedTerm.length,
                        minimumLength: this.rules.min_search_length,
                    },
                }
            }

            if (normalizedTerm.length > this.rules.max_search_length) {
                return {
                    isValid: false,
                    error: ValidationError.TOO_LONG,
                    message: `Search term cannot exceed ${this.rules.max_search_length} characters`,
                    code: "SEARCH_TOO_LONG",
                    details: {
                        currentLength: normalizedTerm.length,
                        maximumLength: this.rules.max_search_length,
                    },
                }
            }

            // Security validation
            const sanitization = this.security.sanitizerMethods.sanitizeSQLInjection(normalizedTerm)

            if (sanitization.isDangerous) {
                return {
                    isValid: false,
                    error: ValidationError.SECURITY_THREAT,
                    message: "Search term contains potentially malicious characters",
                    code: "SEARCH_SECURITY_THREAT",
                }
            }

            // Character set validation (for internationalization)
            if (!this.isValidCharacterSet(normalizedTerm)) {
                return {
                    isValid: false,
                    error: ValidationError.INVALID_CHARACTERS,
                    message: "Search term contains invalid characters",
                    code: "SEARCH_INVALID_CHARACTERS",
                }
            }

            // Success validation
            return {
                isValid: true,
                error: null,
                message: "Search term is valid",
                code: "SEARCH_VALID",
                details: {
                    normalizedTerm,
                    originalLength: this.searchTerm.length,
                    normalizedLength: normalizedTerm.length,
                },
            }
        } catch (error: any) {
            console.error("Critical error during search validation:", {
                error: error.message,
                stack: error.stack,
                searchTerm: this.searchTerm,
                timestamp: new Date().toISOString(),
            })

            return {
                isValid: false,
                error: ValidationError.VALIDATION_ERROR,
                message: "An unexpected error occurred during validation",
                code: "SEARCH_VALIDATION_ERROR",
                details: {
                    errorId: this.generateErrorId(),
                    timestamp: new Date().toISOString(),
                },
            }
        }
    }

    /**
     * Validates character set for internationalization support
     * @param term - The search term to validate
     * @returns boolean indicating if character set is valid
     */
    private isValidCharacterSet(term: string): boolean {
        // Allow letters, numbers, spaces, hyphens, underscores, and common punctuation
        // Support for international characters (Unicode)
        const validCharacterRegex = /^[\p{L}\p{N}\s\-_.,!?@#$%&*()+=\[\]{}|\\:";'<>\/]+$/u
        return validCharacterRegex.test(term)
    }

    /**
     * Generates unique error ID for tracking
     * @returns string error ID
     */
    public generateErrorId(): string {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    public filterSearchParams() {
        return {
            [Op.and]: [
                sequelize.literal(
                    `MATCH (username) AGAINST ('${this.searchTerm}*' IN BOOLEAN MODE)`
                ),
                { id: { [Op.not]: this.user.id } },
                { blocked: { [Op.not]: true } },
                { deleted: { [Op.not]: true } },
            ],
        }
    }

    public rank(candidates: any[], type: "related" | "unknown"): any[] {
        // Calcula o score de cada candidato e retorna ordenando do maior para o menor
        const weights = this.weights[type]
        return candidates
            .map((candidate) => {
                let totalScore = candidate.weight

                for (const criterion in weights) {
                    if (
                        candidate[criterion] !== undefined &&
                        weights[criterion].weight !== undefined
                    ) {
                        totalScore += candidate[criterion] ? weights[criterion].weight : 0
                    }
                }
                return {
                    id: candidate.id,
                    username: candidate.username,
                    name: candidate.name,
                    verifyed: candidate.verifyed,
                    blocked: candidate.blocked,
                    you_follow: candidate.you_follow,
                    profile_picture: candidate.profile_picture,
                    statistic: {
                        total_followers_num: candidate?.statistic?.total_followers_num,
                    },
                    score: totalScore,
                }
            })
            .sort((a, b) => b.score - a.score)
    }
}
