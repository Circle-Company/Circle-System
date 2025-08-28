import relatedWeights from "./src/database/related_candidates_weights.json"
import unknownWeights from "./src/database/unknown_candidates_weights.json"
import rules from "./src/database/rules.json"
import { relatedCandidates } from "./relatedCandiades"
import { unknownCandidates } from "./unknownCandidates"
import { mixerService } from "./mixerService"
import { securityFilter } from "./securityFilter"

export class SearchEngine {
    public readonly rules: typeof rules
    public readonly searchTerm: string
    public readonly user: {
        id: string
        isPremium: boolean
    }
    public readonly weights: {
        unknown: typeof unknownWeights
        related: typeof relatedWeights
    }

    constructor({
        searchTerm,
        user,
    }: {
        searchTerm: string
        user: {
            id: string
            isPremium: boolean
        }
    }) {
        this.rules = rules
        this.searchTerm = this.isValidSearchTerm().normalizedTerm || ""
        this.user = user
        this.weights = {
            unknown: unknownWeights,
            related: relatedWeights,
        }
    }

    /**
     * Executa busca de candidatos em paralelo
     */
    private async executeParallelCandidatesSearch(
        related: relatedCandidates,
        unknown: unknownCandidates
    ) {
        const searchPromises = [
            this.executeWithTimeout(related.process(), "related", this.rules.timeout_ms),
            this.executeWithTimeout(unknown.process(), "unknown", this.rules.timeout_ms),
        ]

        // Executa com Promise.allSettled para melhor controle de erros
        const results = await Promise.allSettled(searchPromises)

        // Processa resultados com fallback
        const [relatedResult, unknownResult] = results.map((result, index) => {
            if (result.status === "fulfilled") {
                return result.value
            } else {
                console.warn(
                    `⚠️ Busca ${index === 0 ? "related" : "unknown"} falhou:`,
                    result.reason
                )
                return [] // Fallback para array vazio
            }
        })

        return [relatedResult, unknownResult]
    }

    /**
     * Executa promise com timeout
     */
    private async executeWithTimeout<T>(
        promise: Promise<T>,
        operation: string,
        timeoutMs: number
    ): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Timeout: ${operation} excedeu ${timeoutMs}ms`))
            }, timeoutMs)
        })

        return Promise.race([promise, timeoutPromise])
    }

    /**
     * Busca principal com paralelização otimizada
     */
    public async search() {
        try {
            console.log(`🔍 Iniciando busca paralela para: "${this.searchTerm}"`)

            // Inicializa serviços em paralelo
            const [related, unknown, mixer, security] = await Promise.all([
                new relatedCandidates(this),
                new unknownCandidates(this),
                new mixerService(this),
                new securityFilter(this),
            ])

            // Executa buscas em paralelo
            const [relatedResults, unknownResults] = await this.executeParallelCandidatesSearch(
                related,
                unknown
            )

            // Mistura resultados
            const mixed = mixer.mix(relatedResults, unknownResults)

            // Filtra resultados
            const filtered = security.filter(mixed)

            return { filtered }
        } catch (error) {
            console.error(`❌ Erro na busca:`, error)
            throw error
        }
    }
}
