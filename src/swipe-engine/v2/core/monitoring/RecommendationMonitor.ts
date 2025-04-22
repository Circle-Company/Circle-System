/**
 * Monitoramento de Recomendações
 *
 * Esta classe é responsável por coletar métricas de desempenho
 * do sistema de recomendação, identificar problemas e gerar relatórios.
 */

import { Recommendation, RecommendationMetrics, UserInteraction } from "../types"

export class RecommendationMonitor {
    private metrics: Map<string, RecommendationMetrics>
    private interactionLog: UserInteraction[]
    private recommendationLog: Map<string, Recommendation[]>
    private metricHistory: Map<string, RecommendationMetrics[]>
    private anomalyThresholds: Map<string, number>

    constructor() {
        this.metrics = new Map()
        this.interactionLog = []
        this.recommendationLog = new Map()
        this.metricHistory = new Map()
        this.anomalyThresholds = new Map([
            ["ctr", 0.05], // 5% abaixo da média é considerado uma anomalia
            ["avgEngagementTime", 10], // 10 segundos abaixo da média é uma anomalia
            ["diversityScore", 0.1], // 10% abaixo da média é uma anomalia
        ])
    }

    /**
     * Registra uma nova recomendação feita para um usuário
     * @param userId ID do usuário
     * @param recommendations Lista de recomendações apresentadas
     */
    public logRecommendations(userId: bigint, recommendations: Recommendation[]): void {
        const userIdStr = userId.toString()

        if (!this.recommendationLog.has(userIdStr)) {
            this.recommendationLog.set(userIdStr, [])
        }

        // Adicionar timestamp às recomendações para análises temporais
        const timestampedRecommendations = recommendations.map((rec) => ({
            ...rec,
            timestamp: new Date(),
        }))

        this.recommendationLog.get(userIdStr)?.push(...timestampedRecommendations)

        // Limitar o tamanho do log para evitar consumo excessivo de memória
        const maxLogSize = 1000
        const currentLog = this.recommendationLog.get(userIdStr) || []
        if (currentLog.length > maxLogSize) {
            this.recommendationLog.set(userIdStr, currentLog.slice(currentLog.length - maxLogSize))
        }
    }

    /**
     * Registra uma interação do usuário com uma recomendação
     * @param interaction Detalhes da interação
     */
    public logInteraction(interaction: UserInteraction): void {
        this.interactionLog.push({
            ...interaction,
            timestamp: interaction.timestamp || new Date(),
        })

        // Atualizar métricas com base na interação
        this.updateMetrics(interaction)

        // Limitar o tamanho do log
        const maxLogSize = 10000
        if (this.interactionLog.length > maxLogSize) {
            this.interactionLog = this.interactionLog.slice(this.interactionLog.length - maxLogSize)
        }
    }

    /**
     * Calcula todas as métricas de desempenho atuais
     * @returns Métricas de recomendação consolidadas
     */
    public calculateMetrics(): Map<string, RecommendationMetrics> {
        // Calcular métricas globais
        const globalMetrics = this.calculateGlobalMetrics()
        this.metrics.set("global", globalMetrics)

        // Calcular métricas por segmento de usuário
        this.calculateSegmentMetrics()

        // Detectar anomalias nas métricas
        this.detectAnomalies()

        // Armazenar métricas no histórico
        this.storeMetricsHistory()

        return this.metrics
    }

    /**
     * Gera um relatório de desempenho do sistema
     */
    public generateReport(): string {
        const globalMetrics = this.metrics.get("global")

        if (!globalMetrics) {
            return "Não há dados suficientes para gerar um relatório."
        }

        const report = `
RELATÓRIO DE DESEMPENHO DO SISTEMA DE RECOMENDAÇÃO
================================================
Período: ${new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString()} - ${new Date().toLocaleDateString()}

MÉTRICAS GLOBAIS:
- Taxa de Cliques (CTR): ${(globalMetrics.ctr * 100).toFixed(2)}%
- Tempo Médio de Engajamento: ${globalMetrics.avgEngagementTime.toFixed(2)}s
- Diversidade de Conteúdo: ${(globalMetrics.diversityScore * 100).toFixed(2)}%
- Precisão: ${(globalMetrics.precision * 100).toFixed(2)}%
- Recall: ${(globalMetrics.recall * 100).toFixed(2)}%
- Cobertura de Catálogo: ${(globalMetrics.catalogCoverage * 100).toFixed(2)}%
- Novidade (Serendipidade): ${(globalMetrics.noveltyScore * 100).toFixed(2)}%

ANOMALIAS DETECTADAS:
${this.getAnomalyReport()}

TENDÊNCIAS:
${this.getTrendsReport()}

RECOMENDAÇÕES DE OTIMIZAÇÃO:
${this.getOptimizationSuggestions()}
`

        return report
    }

    /**
     * Detecta padrões de engajamento e possíveis vieses
     */
    public detectPatterns(): Map<string, any> {
        const patterns = new Map<string, any>()

        // Analisar padrões de engajamento ao longo do dia
        patterns.set("hourlyEngagement", this.analyzeHourlyEngagement())

        // Detectar viés para certos tipos de conteúdo
        patterns.set("contentBias", this.detectContentBias())

        // Analisar ciclos de feedback
        patterns.set("feedbackLoops", this.analyzeFeedbackLoops())

        return patterns
    }

    /**
     * Simula eventos reais para testar o sistema de monitoramento
     */
    public simulateMonitoringData(): void {
        // Simular recomendações
        for (let i = 0; i < 10; i++) {
            const userId = BigInt(1000 + i)
            const recommendations = Array(20)
                .fill(0)
                .map((_, idx) => ({
                    entityId: BigInt(2000 + idx),
                    entityType: "post",
                    score: 0.9 - idx * 0.04,
                    reason: "similar_interest",
                    timestamp: new Date(Date.now() - Math.random() * 86400000),
                }))

            this.logRecommendations(userId, recommendations)

            // Simular interações
            for (let j = 0; j < 5; j++) {
                const rec = recommendations[j]
                this.logInteraction({
                    userId: userId,
                    entityId: rec.entityId,
                    entityType: rec.entityType,
                    type: Math.random() > 0.5 ? "like" : "view",
                    timestamp: new Date(rec.timestamp.getTime() + 30000 + Math.random() * 300000),
                    metadata: {
                        engagementTime: 20 + Math.random() * 60,
                        userId: userId,
                        contextId: "feed",
                    },
                })
            }
        }

        // Calcular métricas com os dados simulados
        this.calculateMetrics()
    }

    // Métodos privados auxiliares

    /**
     * Atualiza métricas com base em uma nova interação
     */
    private updateMetrics(interaction: UserInteraction): void {
        const userIdStr = interaction.userId.toString()

        // Inicializar métricas do usuário se não existirem
        if (!this.metrics.has(userIdStr)) {
            this.metrics.set(userIdStr, this.createEmptyMetrics())
        }

        const metrics = this.metrics.get(userIdStr)
        if (!metrics) return

        // Atualizar métricas com base no tipo de interação
        if (interaction.type === "view") {
            metrics.impressions++

            // Atualizar tempo de engajamento
            const engagementTime = interaction.metadata?.engagementTime
            if (engagementTime && typeof engagementTime === "number") {
                metrics.totalEngagementTime += engagementTime
                metrics.avgEngagementTime = metrics.totalEngagementTime / metrics.impressions
            }
        } else if (
            interaction.type === "like" ||
            interaction.type === "comment" ||
            interaction.type === "share" ||
            interaction.type === "save"
        ) {
            metrics.engagements++

            // Atualizar CTR (Click-Through Rate)
            metrics.ctr = metrics.engagements / (metrics.impressions || 1)
        }
    }

    /**
     * Calcula métricas globais do sistema
     */
    private calculateGlobalMetrics(): RecommendationMetrics {
        const globalMetrics = this.createEmptyMetrics()
        let userCount = 0

        // Agregar métricas de todos os usuários
        for (const [userId, metrics] of this.metrics.entries()) {
            if (userId === "global") continue

            globalMetrics.impressions += metrics.impressions
            globalMetrics.engagements += metrics.engagements
            globalMetrics.totalEngagementTime += metrics.totalEngagementTime

            // Métricas que não podem ser somadas diretamente
            userCount++
        }

        // Calcular médias
        if (userCount > 0) {
            globalMetrics.ctr = globalMetrics.engagements / (globalMetrics.impressions || 1)
            globalMetrics.avgEngagementTime =
                globalMetrics.totalEngagementTime / (globalMetrics.impressions || 1)
        }

        // Calcular outros indicadores globais
        globalMetrics.diversityScore = this.calculateDiversityScore()
        globalMetrics.noveltyScore = this.calculateNoveltyScore()
        globalMetrics.catalogCoverage = this.calculateCatalogCoverage()
        globalMetrics.precision = this.calculatePrecision()
        globalMetrics.recall = this.calculateRecall()

        return globalMetrics
    }

    /**
     * Calcula métricas por segmento de usuário
     */
    private calculateSegmentMetrics(): void {
        // Implementação futura: segmentação por demografia, comportamento, etc.
        // Exemplo simples: segmentar por nível de atividade

        const activeUsers = new Set<string>()
        const inactiveUsers = new Set<string>()

        for (const [userId, metrics] of this.metrics.entries()) {
            if (userId === "global") continue

            if (metrics.engagements > 10) {
                activeUsers.add(userId)
            } else {
                inactiveUsers.add(userId)
            }
        }

        // Calcular métricas para usuários ativos
        if (activeUsers.size > 0) {
            const activeMetrics = this.createEmptyMetrics()
            for (const userId of activeUsers) {
                const userMetrics = this.metrics.get(userId)
                if (!userMetrics) continue

                activeMetrics.impressions += userMetrics.impressions
                activeMetrics.engagements += userMetrics.engagements
                activeMetrics.totalEngagementTime += userMetrics.totalEngagementTime
            }

            activeMetrics.ctr = activeMetrics.engagements / (activeMetrics.impressions || 1)
            activeMetrics.avgEngagementTime =
                activeMetrics.totalEngagementTime / (activeMetrics.impressions || 1)

            this.metrics.set("segment_active", activeMetrics)
        }

        // Métricas para usuários inativos - implementação similar
    }

    /**
     * Cria um objeto de métricas vazio
     */
    private createEmptyMetrics(): RecommendationMetrics {
        return {
            impressions: 0,
            engagements: 0,
            ctr: 0,
            avgEngagementTime: 0,
            totalEngagementTime: 0,
            diversityScore: 0,
            noveltyScore: 0,
            catalogCoverage: 0,
            precision: 0,
            recall: 0,
        }
    }

    /**
     * Calcula a diversidade do conteúdo recomendado
     */
    private calculateDiversityScore(): number {
        // Implementação simplificada
        // Em uma versão real, calcularia a diversidade de tópicos, criadores, etc.
        return 0.75 // Valor simulado
    }

    /**
     * Calcula o quão novo e inesperado é o conteúdo recomendado
     */
    private calculateNoveltyScore(): number {
        // Implementação simplificada
        return 0.65 // Valor simulado
    }

    /**
     * Calcula a porcentagem do catálogo que está sendo mostrada aos usuários
     */
    private calculateCatalogCoverage(): number {
        // Implementação simplificada
        return 0.35 // Valor simulado
    }

    /**
     * Calcula a precisão das recomendações (quantas recomendações foram relevantes)
     */
    private calculatePrecision(): number {
        const globalMetrics = this.metrics.get("global")
        if (!globalMetrics) return 0

        // Simplificação: usar CTR como aproximação da precisão
        return Math.min(globalMetrics.ctr * 1.5, 1.0)
    }

    /**
     * Calcula o recall das recomendações (quantos itens relevantes foram recomendados)
     */
    private calculateRecall(): number {
        // Implementação simplificada
        return 0.7 // Valor simulado
    }

    /**
     * Detecta anomalias nas métricas atuais
     */
    private detectAnomalies(): Map<string, any> {
        const anomalies = new Map<string, any>()
        const globalMetrics = this.metrics.get("global")

        if (!globalMetrics) return anomalies

        // Verificar métricas históricas
        const historicalMetrics = this.metricHistory.get("global") || []
        if (historicalMetrics.length < 7) return anomalies // Precisa de dados históricos suficientes

        // Calcular médias históricas
        const avgCtr = this.calculateAverage(historicalMetrics.map((m) => m.ctr))
        const avgEngagementTime = this.calculateAverage(
            historicalMetrics.map((m) => m.avgEngagementTime)
        )
        const avgDiversityScore = this.calculateAverage(
            historicalMetrics.map((m) => m.diversityScore)
        )

        // Verificar anomalias
        const ctrThreshold = this.anomalyThresholds.get("ctr") || 0.05
        if (globalMetrics.ctr < avgCtr - ctrThreshold) {
            anomalies.set("ctr", {
                current: globalMetrics.ctr,
                average: avgCtr,
                difference: avgCtr - globalMetrics.ctr,
                percentDrop: ((avgCtr - globalMetrics.ctr) / avgCtr) * 100,
            })
        }

        const engagementThreshold = this.anomalyThresholds.get("avgEngagementTime") || 10
        if (globalMetrics.avgEngagementTime < avgEngagementTime - engagementThreshold) {
            anomalies.set("avgEngagementTime", {
                current: globalMetrics.avgEngagementTime,
                average: avgEngagementTime,
                difference: avgEngagementTime - globalMetrics.avgEngagementTime,
                percentDrop:
                    ((avgEngagementTime - globalMetrics.avgEngagementTime) / avgEngagementTime) *
                    100,
            })
        }

        const diversityThreshold = this.anomalyThresholds.get("diversityScore") || 0.1
        if (globalMetrics.diversityScore < avgDiversityScore - diversityThreshold) {
            anomalies.set("diversityScore", {
                current: globalMetrics.diversityScore,
                average: avgDiversityScore,
                difference: avgDiversityScore - globalMetrics.diversityScore,
                percentDrop:
                    ((avgDiversityScore - globalMetrics.diversityScore) / avgDiversityScore) * 100,
            })
        }

        return anomalies
    }

    /**
     * Armazena métricas atuais no histórico para análises futuras
     */
    private storeMetricsHistory(): void {
        for (const [key, metrics] of this.metrics.entries()) {
            if (!this.metricHistory.has(key)) {
                this.metricHistory.set(key, [])
            }

            // Clonar métricas para evitar referências compartilhadas
            const metricsCopy = { ...metrics }
            this.metricHistory.get(key)?.push(metricsCopy)

            // Limitar tamanho do histórico
            const maxHistorySize = 30 // 30 dias
            const history = this.metricHistory.get(key) || []
            if (history.length > maxHistorySize) {
                this.metricHistory.set(key, history.slice(history.length - maxHistorySize))
            }
        }
    }

    /**
     * Gera um relatório de anomalias detectadas
     */
    private getAnomalyReport(): string {
        const anomalies = this.detectAnomalies()

        if (anomalies.size === 0) {
            return "Nenhuma anomalia detectada no período."
        }

        let report = ""

        if (anomalies.has("ctr")) {
            const data = anomalies.get("ctr")
            report += `- ALERTA: Queda na taxa de cliques (CTR) de ${data.percentDrop.toFixed(
                2
            )}%\n`
            report += `  Valor atual: ${(data.current * 100).toFixed(2)}%, Média: ${(
                data.average * 100
            ).toFixed(2)}%\n`
        }

        if (anomalies.has("avgEngagementTime")) {
            const data = anomalies.get("avgEngagementTime")
            report += `- ALERTA: Queda no tempo médio de engajamento de ${data.percentDrop.toFixed(
                2
            )}%\n`
            report += `  Valor atual: ${data.current.toFixed(2)}s, Média: ${data.average.toFixed(
                2
            )}s\n`
        }

        if (anomalies.has("diversityScore")) {
            const data = anomalies.get("diversityScore")
            report += `- ALERTA: Redução na diversidade de conteúdo de ${data.percentDrop.toFixed(
                2
            )}%\n`
            report += `  Valor atual: ${(data.current * 100).toFixed(2)}%, Média: ${(
                data.average * 100
            ).toFixed(2)}%\n`
        }

        return report
    }

    /**
     * Gera um relatório de tendências nas métricas
     */
    private getTrendsReport(): string {
        // Implementação simplificada
        return "Análise de tendências não disponível nesta versão."
    }

    /**
     * Sugere otimizações com base nas métricas atuais
     */
    private getOptimizationSuggestions(): string {
        const globalMetrics = this.metrics.get("global")

        if (!globalMetrics) {
            return "Dados insuficientes para gerar sugestões."
        }

        let suggestions = ""

        // Sugestões baseadas nas métricas
        if (globalMetrics.diversityScore < 0.6) {
            suggestions +=
                "- Aumentar a diversidade de conteúdo recomendado, ajustando parâmetros de diversificação.\n"
        }

        if (globalMetrics.ctr < 0.1) {
            suggestions +=
                "- Melhorar a relevância das recomendações, utilizando mais dados de contexto do usuário.\n"
        }

        if (globalMetrics.avgEngagementTime < 30) {
            suggestions +=
                "- Focar em conteúdo que promova maior tempo de engajamento, ajustando os pesos dos sinais de qualidade.\n"
        }

        if (globalMetrics.catalogCoverage < 0.3) {
            suggestions +=
                "- Aumentar a exposição de itens de cauda longa para melhorar a cobertura do catálogo.\n"
        }

        return suggestions || "Nenhuma sugestão de otimização identificada no momento."
    }

    /**
     * Analisa padrões de engajamento por hora do dia
     */
    private analyzeHourlyEngagement(): Map<number, number> {
        const hourlyEngagement = new Map<number, number>()

        // Inicializar mapa com zeros
        for (let hour = 0; hour < 24; hour++) {
            hourlyEngagement.set(hour, 0)
        }

        // Contar engajamentos por hora
        for (const interaction of this.interactionLog) {
            if (interaction.type === "view" || interaction.type === "like") {
                const hour = interaction.timestamp.getHours()
                hourlyEngagement.set(hour, (hourlyEngagement.get(hour) || 0) + 1)
            }
        }

        return hourlyEngagement
    }

    /**
     * Detecta viés para certos tipos de conteúdo
     */
    private detectContentBias(): any {
        // Implementação simplificada
        return {
            detected: false,
            details: "Análise de viés não implementada nesta versão.",
        }
    }

    /**
     * Analisa ciclos de feedback nas recomendações
     */
    private analyzeFeedbackLoops(): any {
        // Implementação simplificada
        return {
            detected: false,
            details: "Análise de ciclos de feedback não implementada nesta versão.",
        }
    }

    /**
     * Calcula a média de um array de números
     */
    private calculateAverage(values: number[]): number {
        if (values.length === 0) return 0
        return values.reduce((sum, val) => sum + val, 0) / values.length
    }
}
