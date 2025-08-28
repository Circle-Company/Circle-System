import { baseFunctions } from "./baseFunctions"
import { SearchEngine } from "./searchEngine"

export class mixerService extends baseFunctions {
    constructor(searchEngine: SearchEngine) {
        super(searchEngine)
    }

    private removeDuplicates(related: any[], unknown: any[]): { related: any[]; unknown: any[] } {
        const seenIds = new Set<bigint | number>()
        const relatedFiltered: any[] = []
        const unknownFiltered: any[] = []

        // Processa lista de relacionados primeiro (prioridade)
        for (const user of related) {
            const userId = user.id || user.user_id
            if (!seenIds.has(userId)) {
                seenIds.add(userId)
                relatedFiltered.push(user)
            }
        }

        // Processa lista de desconhecidos, removendo duplicados
        for (const user of unknown) {
            const userId = user.id || user.user_id
            if (!seenIds.has(userId)) {
                seenIds.add(userId)
                unknownFiltered.push(user)
            }
        }

        return { related: relatedFiltered, unknown: unknownFiltered }
    }

    public mix(related: any[], unknown: any[]) {
        // Remove duplicados antes da mistura
        const { related: relatedFiltered, unknown: unknownFiltered } = this.removeDuplicates(
            related,
            unknown
        )

        const mixCoefficient = this.rules.mix_coefficient
        const mixed: any[] = []

        const totalLength = relatedFiltered.length + unknownFiltered.length

        if (totalLength === 0) return mixed

        // Calcula quantos itens de cada lista devem ser incluídos
        const relatedCount = Math.round(totalLength * mixCoefficient)
        const unknownCount = totalLength - relatedCount

        // Cria arrays com as quantidades calculadas
        const relatedToUse = relatedFiltered.slice(0, relatedCount)
        const unknownToUse = unknownFiltered.slice(0, unknownCount)

        // Intercala baseado no coeficiente
        if (mixCoefficient >= 0.8) {
            // Alta intercalação - distribui uniformemente
            const maxLength = Math.max(relatedToUse.length, unknownToUse.length)
            for (let i = 0; i < maxLength; i++) {
                if (i < relatedToUse.length) mixed.push(relatedToUse[i])
                if (i < unknownToUse.length) mixed.push(unknownToUse[i])
            }
        } else if (mixCoefficient >= 0.6) {
            // Média intercalação - alterna em blocos pequenos
            const blockSize = Math.ceil(1 / mixCoefficient)
            let relatedIndex = 0
            let unknownIndex = 0

            while (relatedIndex < relatedToUse.length || unknownIndex < unknownToUse.length) {
                // Adiciona blocos de relacionados
                for (let i = 0; i < blockSize && relatedIndex < relatedToUse.length; i++) {
                    mixed.push(relatedToUse[relatedIndex++])
                }
                // Adiciona blocos de desconhecidos
                for (let i = 0; i < blockSize && unknownIndex < unknownToUse.length; i++) {
                    mixed.push(unknownToUse[unknownIndex++])
                }
            }
        } else {
            // Baixa intercalação - mantém grupos separados com ponto de encontro
            const relatedFirst = mixCoefficient > 0.5

            if (relatedFirst) {
                // Coloca relacionados primeiro, depois desconhecidos
                mixed.push(...relatedToUse)
                mixed.push(...unknownToUse)
            } else {
                // Coloca desconhecidos primeiro, depois relacionados
                mixed.push(...unknownToUse)
                mixed.push(...relatedToUse)
            }
        }

        return mixed
    }
}
