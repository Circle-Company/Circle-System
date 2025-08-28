import { baseFunctions } from "./baseFunctions"
import { SearchEngine } from "./searchEngine"
import { ReturnUserProps } from "./src/types"

interface SecurityFilterConfig {
    enableBlockedUserFilter: boolean
    enableContentFilter: boolean
    enableSpamFilter: boolean
    maxResultsPerRequest: number
    suspiciousPatterns: string[]
}

export class securityFilter extends baseFunctions {
    private readonly config: SecurityFilterConfig

    constructor(searchEngine: SearchEngine, config?: Partial<SecurityFilterConfig>) {
        super(searchEngine)

        this.config = {
            enableBlockedUserFilter: true,
            enableContentFilter: true,
            enableSpamFilter: true,
            maxResultsPerRequest: this.rules.max_results_per_page,
            suspiciousPatterns: [
                "spam",
                "bot",
                "fake",
                "scam",
                "hack",
                "crypto",
                "bitcoin",
                "investment",
                "earn money",
                "follow back",
                "like for like",
                "follow4follow",
            ],
            ...config,
        }
    }

    /**
     * Filtro principal para resultados de relatedCandidates e unknownCandidates
     */
    public filter(candidates: any[]): ReturnUserProps[] {
        if (!candidates || candidates.length === 0) {
            return []
        }

        console.log(`🔒 Iniciando filtro de segurança para ${candidates.length} candidatos`)

        try {
            // Processa todos os filtros em paralelo
            const [blockedUsersFiltered, contentFiltered, spamFiltered] =
                this.processFiltersInParallel(candidates)

            // Combina os resultados dos filtros
            let filteredCandidates = this.combineFilterResults(
                candidates,
                blockedUsersFiltered,
                contentFiltered,
                spamFiltered
            )

            // Limita o número de resultados
            filteredCandidates = this.limitResults(filteredCandidates)

            // Mapeia para o formato de retorno
            const result = this.mapToReturnFormat(filteredCandidates)

            console.log(`✅ Filtro de segurança concluído: ${result.length} candidatos aprovados`)

            return result
        } catch (error) {
            console.error(`❌ Erro no filtro de segurança:`, error)
            return []
        }
    }

    /**
     * Processa todos os filtros em paralelo
     */
    private processFiltersInParallel(candidates: any[]): [Set<number>, Set<number>, Set<number>] {
        // Processa filtros em paralelo
        const blockedUsers = this.processBlockedUsersFilter(candidates)
        const inappropriateContent = this.processContentFilter(candidates)
        const spamUsers = this.processSpamFilter(candidates)

        return [blockedUsers, inappropriateContent, spamUsers]
    }

    /**
     * Processa filtro de usuários bloqueados em paralelo
     */
    private processBlockedUsersFilter(candidates: any[]): Set<number> {
        if (!this.config.enableBlockedUserFilter) {
            return new Set()
        }

        const blockedIndices = new Set<number>()

        // Processa em chunks para otimizar performance
        const chunkSize = 100
        for (let i = 0; i < candidates.length; i += chunkSize) {
            const chunk = candidates.slice(i, i + chunkSize)

            chunk.forEach((candidate, chunkIndex) => {
                const globalIndex = i + chunkIndex
                const isBlocked = candidate.blocked === true
                const hasMutualBlock = candidate.you_block === true || candidate.block_you === true
                if (isBlocked || hasMutualBlock) {
                    blockedIndices.add(globalIndex)
                }
            })
        }

        return blockedIndices
    }

    /**
     * Processa filtro de conteúdo inapropriado em paralelo
     */
    private processContentFilter(candidates: any[]): Set<number> {
        if (!this.config.enableContentFilter) {
            return new Set()
        }

        const inappropriateIndices = new Set<number>()

        const chunkSize = 100
        for (let i = 0; i < candidates.length; i += chunkSize) {
            const chunk = candidates.slice(i, i + chunkSize)

            chunk.forEach((candidate, chunkIndex) => {
                const globalIndex = i + chunkIndex
                const username = (candidate.username || "").toLowerCase()
                const name = (candidate.name || "").toLowerCase()

                const hasSuspiciousPattern = this.config.suspiciousPatterns.some(
                    (pattern) => username.includes(pattern) || name.includes(pattern)
                )

                const hasSuspiciousChars =
                    /[<>{}()\[\]]/.test(username) || /[<>{}()\[\]]/.test(name)

                if (hasSuspiciousPattern || hasSuspiciousChars) {
                    inappropriateIndices.add(globalIndex)
                }
            })
        }

        return inappropriateIndices
    }

    /**
     * Processa filtro de spam em paralelo
     */
    private processSpamFilter(candidates: any[]): Set<number> {
        if (!this.config.enableSpamFilter) {
            return new Set()
        }

        const spamIndices = new Set<number>()

        const chunkSize = 100
        for (let i = 0; i < candidates.length; i += chunkSize) {
            const chunk = candidates.slice(i, i + chunkSize)

            chunk.forEach((candidate, chunkIndex) => {
                const globalIndex = i + chunkIndex
                const username = candidate.username || ""
                const name = candidate.name || ""
                const statistic = candidate.statistic || {}

                const hasManyFollowers = statistic.total_followers_num > 1000
                const hasSuspiciousUsername =
                    username.length < 3 || username.length > 20 || /^\d+$/.test(username)

                const hasGenericName = ["user", "test", "admin", "moderator"].includes(
                    name.toLowerCase()
                )

                const isMuted = candidate.muted === true

                if ((hasManyFollowers && hasSuspiciousUsername) || hasGenericName || isMuted) {
                    spamIndices.add(globalIndex)
                }
            })
        }

        return spamIndices
    }

    /**
     * Combina os resultados dos filtros
     */
    private combineFilterResults(
        candidates: any[],
        blockedUsers: Set<number>,
        inappropriateContent: Set<number>,
        spamUsers: Set<number>
    ): any[] {
        const allBlockedIndices = new Set([...blockedUsers, ...inappropriateContent, ...spamUsers])

        return candidates.filter((_, index) => !allBlockedIndices.has(index))
    }

    /**
     * Limita o número de resultados
     */
    private limitResults(candidates: any[]): any[] {
        return candidates.slice(0, this.config.maxResultsPerRequest)
    }

    /**
     * Mapeia para o formato de retorno padrão
     */
    private mapToReturnFormat(candidates: any[]): ReturnUserProps[] {
        return candidates.map((candidate) => ({
            id: candidate.id,
            username: candidate.username,
            name: candidate.name,
            verifyed: candidate.verifyed || false,
            you_follow: candidate.you_follow || false,
            statistics: candidate.statistic || { total_followers_num: 0 },
            profile_picture: candidate.profile_picture || { tiny_resolution: null },
        }))
    }

    /**
     * Verifica se um candidato específico passa em todos os filtros
     */
    public validateCandidate(candidate: any): boolean {
        const result = this.filter([candidate])
        return result.length > 0
    }
}
