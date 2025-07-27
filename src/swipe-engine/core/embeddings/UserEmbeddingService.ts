import * as path from "path"

import { EmbeddingVector, UserEmbeddingProps, UserEmbedding as UserEmbeddingType, UserInteraction } from "../types"
import { FeatureExtractionPipeline, pipeline } from "@xenova/transformers"

import InteractionEvent from "../../models/InteractionEvent"
import { EmbeddingParams as Params } from "../../params"
import UserEmbedding from "../../models/UserEmbedding"
import { getLogger } from "../utils/logger"
import { normalizeL2 } from "../utils/normalization"
import { resizeVector } from "../utils/vector-operations"

export class UserEmbeddingService {
    private readonly logger = getLogger("UserEmbeddingService")
    private embeddingPipeline: FeatureExtractionPipeline | null = null
    private readonly MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
    private readonly CACHE_DIR = path.join(process.cwd(), "models/xenova-cache")
    private readonly SNAPSHOT_ID = "c9745ed1d9f207416be6d2e6f8de32d1f16199bf"  // ID específico do snapshot
    private readonly XENOVA_MODEL_PATH = "models/all-MiniLM-L6-v2"  // Caminho relativo para o Xenova
    private readonly dimension: number
    private modelLoadAttempted: boolean = false

    constructor(
        embeddingDimension: number = Params.dimensions.embedding,
    ) {
        this.dimension = embeddingDimension
        
        // Garantir que o diretório de cache existe e tem permissões corretas
        try {
            const fs = require('fs')
            if (!fs.existsSync(this.CACHE_DIR)) {
                fs.mkdirSync(this.CACHE_DIR, { recursive: true, mode: 0o777 })
            }
            // Definir variável de ambiente para o cache
            process.env.TRANSFORMERS_CACHE = this.CACHE_DIR
        } catch (error) {
            this.logger.error(`Erro ao configurar diretório de cache: ${error}`)
        }
        
        this.logger.info(`UserEmbeddingService inicializado - dimensão: ${embeddingDimension}, usando modelo: ${this.MODEL_ID}, cache: ${this.CACHE_DIR}`)
    }

    private isModelComplete(): boolean {
        try {
            const fs = require('fs')
            const path = require('path')
            
            // Lista de arquivos essenciais que o modelo precisa ter
            const requiredFiles = [
                'config.json',
                'tokenizer_config.json',
                'tokenizer.json',
                'model.safetensors',
                'special_tokens_map.json'
            ]

            // Verificar se o diretório base existe
            if (!fs.existsSync(this.CACHE_DIR)) {
                this.logger.warn(`Diretório base do modelo não encontrado: ${this.CACHE_DIR}`)
                return false
            }

            // Construir o caminho para o diretório do snapshot
            const snapshotDir = path.join(
                this.CACHE_DIR,
                "models--sentence-transformers--all-MiniLM-L6-v2",
                "snapshots",
                this.SNAPSHOT_ID
            )

            if (!fs.existsSync(snapshotDir)) {
                this.logger.warn(`Diretório do snapshot não encontrado: ${snapshotDir}`)
                return false
            }

            this.logger.info(`Verificando arquivos no snapshot: ${snapshotDir}`)

            // Verificar cada arquivo necessário no snapshot
            for (const file of requiredFiles) {
                const filePath = path.join(snapshotDir, file)
                if (!fs.existsSync(filePath)) {
                    this.logger.warn(`Arquivo do modelo não encontrado no snapshot: ${file}`)
                    return false
                }
                // Log do tamanho do arquivo para debug
                const stats = fs.statSync(filePath)
                this.logger.info(`Arquivo ${file} encontrado (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`)
            }

            return true
        } catch (error) {
            this.logger.error(`Erro ao verificar integridade do modelo: ${error}`)
            return false
        }
    }

    private async cleanupIncompleteModel(): Promise<void> {
        // Não precisamos remover o modelo pois agora estamos usando um caminho fixo
        this.logger.info("Método de limpeza chamado, mas nenhuma ação será tomada para preservar o modelo baixado.");
    }

    protected async loadModel(): Promise<void> {
        try {
            if (!this.embeddingPipeline) {
                this.modelLoadAttempted = true
                this.logger.info("Iniciando carregamento do modelo...")

                try {
                    // Configurar diretório de cache explicitamente
                    this.logger.info(`Usando diretório de cache: ${this.CACHE_DIR}`)
                    
                    // Tentar carregar o modelo, com parâmetros específicos
                    this.embeddingPipeline = await pipeline(
                        "feature-extraction", 
                        this.MODEL_ID,
                        {
                            cache_dir: this.CACHE_DIR,
                            quantized: false, // Não usar versão quantizada
                            progress_callback: (progress) => {
                                if (progress.status === 'progress') {
                                    this.logger.info(`Download em progresso: ${progress.progress}%`)
                                }
                            }
                        }
                    ) as FeatureExtractionPipeline;
                    
                    this.logger.info("Modelo carregado com sucesso!");
                } catch (loadError) {
                    this.logger.error(`Erro ao carregar modelo: ${loadError}`);
                    this.logger.info("Usando método de fallback para embeddings.");
                    this.embeddingPipeline = null;
                }
            }
        } catch (error) {
            this.logger.error(`Erro ao carregar modelo: ${error}`)
            this.embeddingPipeline = null
        }
    }

    async generateEmbedding(userData: UserEmbeddingProps): Promise<number[]> {
        try {
            await this.loadModel()
            
            if (!this.embeddingPipeline) {
                this.logger.warn("Usando fallback para geração de embedding")
                return this.generateFallbackEmbeddingVector(userData)
            }

            const userText = this.prepareUserTextForEmbedding(userData)
            
            const output = await this.embeddingPipeline(userText, {
                pooling: 'mean',
                normalize: true
            })

            const embedding = Array.from(output.data).map(val => Number(val))
            return normalizeL2(embedding)

        } catch (error) {
            this.logger.error(`Erro ao gerar embedding: ${error}`)
            return this.generateFallbackEmbeddingVector(userData)
        }
    }

    private prepareUserTextForEmbedding(userData: UserEmbeddingProps): string {
        const parts: string[] = []

        // Adicionar informações de interação
        if (userData.interactionHistory?.length > 0) {
            const interactions = userData.interactionHistory
                .map(i => `${i.type} ${i.entityType}`)
                .join(", ")
            parts.push(`Interações: ${interactions}`)
        }

        // Adicionar padrões de visualização
        if (userData.viewingPatterns?.length > 0) {
            const patterns = userData.viewingPatterns
                .map(p => `${p.contentType} (duração média: ${p.averageDuration}s, taxa de conclusão: ${p.completionRate * 100}%)`)
                .join(", ")
            parts.push(`Padrões de visualização: ${patterns}`)
        }

        // Adicionar preferências de conteúdo
        if (userData.contentPreferences?.length > 0) {
            parts.push(`Preferências: ${userData.contentPreferences.join(", ")}`)
        }

        // Adicionar informações demográficas
        if (userData.demographicInfo) {
            const demo = userData.demographicInfo
            const demoInfo: string[] = []
            
            if (demo.ageRange) demoInfo.push(`idade ${demo.ageRange}`)
            if (demo.location) demoInfo.push(`localização ${demo.location}`)
            if (demo.languages?.length) demoInfo.push(`idiomas: ${demo.languages.join(", ")}`)
            if (demo.interests?.length) demoInfo.push(`interesses: ${demo.interests.join(", ")}`)
            
            if (demoInfo.length > 0) {
                parts.push(`Informações demográficas: ${demoInfo.join("; ")}`)
            }
        }

        // Combinar todas as partes em um texto
        return parts.join("\n")
    }

    public async generateUserEmbedding(userId: bigint): Promise<UserEmbeddingType> {
        try {
            this.logger.info(`Gerando embedding para usuário ${userId}`)

            // Coletar dados do usuário
            const userData = await this.collectUserData(userId)

            // Gerar embedding usando o modelo local
            const vector = await this.generateEmbedding(userData)

            // Persistir o embedding
            await this.saveUserEmbedding(userId, vector)

            // Buscar o embedding salvo
            const savedEmbedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() },
            })

            if (!savedEmbedding) {
                throw new Error(`Erro ao recuperar embedding recém-salvo para usuário ${userId}`)
            }

            // Retornar usando o método de conversão
            return savedEmbedding.toUserEmbeddingType()
        } catch (error: any) {
            this.logger.error(`Erro ao gerar embedding para usuário ${userId}: ${error.message}`)
            return this.generateFallbackEmbedding(userId, error.message)
        }
    }

    private generateFallbackEmbeddingVector(userData: UserEmbeddingProps): number[] {
        this.logger.info("Gerando embedding de fallback baseado em features simples")
        
        const features: number[] = []

        const interactionTypes = new Set(userData.interactionHistory.map(i => i.type))
        const interactionVector = Array.from(interactionTypes).map(type => 
            this.getInteractionWeight(type)
        )
        features.push(...interactionVector)

        if (userData.viewingPatterns.length > 0) {
            const avgDuration = userData.viewingPatterns.reduce((acc, p) => acc + p.averageDuration, 0) / userData.viewingPatterns.length
            const avgCompletion = userData.viewingPatterns.reduce((acc, p) => acc + p.completionRate, 0) / userData.viewingPatterns.length
            features.push(avgDuration / 100, avgCompletion)
        }

        const preferenceVector = new Array(10).fill(0)
        userData.contentPreferences.forEach((pref, idx) => {
            if (idx < 10) preferenceVector[idx] = 1
        })
        features.push(...preferenceVector)

        if (userData.demographicInfo) {
            const demoFeatures = this.processDemographicInfo(userData.demographicInfo)
            features.push(...demoFeatures)
        }

        const resized = resizeVector(features, this.dimension)
        return normalizeL2(resized)
    }

    private generateFallbackEmbedding(userId: bigint, errorMessage: string): UserEmbeddingType {
        const now = new Date()
        return {
            userId: userId.toString(),
            vector: {
                dimension: this.dimension,
                values: new Array(this.dimension).fill(0),
                createdAt: now,
                updatedAt: now,
            },
            metadata: {
                source: "fallback",
                error: errorMessage,
                generatedAt: now.toISOString()
            },
        }
    }

    // Atualiza o embedding atual com base em novas interações
    async updateEmbedding(
        currentEmbedding: number[],
        interaction: UserInteraction
    ): Promise<number[]> {
        // Determinar o peso da atualização com base no tipo de interação
        const interactionWeight = this.getInteractionWeight(interaction.type)

        // Extrair características da interação
        const interactionFeatures = this.extractInteractionFeatures(interaction)

        // Gerar embedding da interação
        const interactionEmbedding = await this.generateInteractionEmbedding(interactionFeatures)

        // Atualizar o embedding atual com o embedding da interação
        const updatedEmbedding = currentEmbedding.map((val, idx) => {
            return val * (1 - interactionWeight) + interactionEmbedding[idx] * interactionWeight
        })

        // Normalizar o embedding atualizado
        return normalizeL2(updatedEmbedding)
    }

    // Recupera ou gera o embedding para um usuário
    async getUserEmbedding(userId: bigint): Promise<UserEmbeddingType | null> {
        try {
            const embedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() },
            })

            if (!embedding) return null

            // Usar o método toUserEmbeddingType do modelo
            return embedding.toUserEmbeddingType()
        } catch (error: any) {
            this.logger.error(`Erro ao buscar embedding do usuário ${userId}: ${error.message}`)
            return null
        }
    }

    private getInteractionWeight(interactionType: string): number {
        const weights: Record<string, number> = {
            view: Params.weights.interactions.view,
            like: Params.weights.interactions.like,
            comment: Params.weights.interactions.comment,
            share: Params.weights.interactions.share,
            save: Params.weights.interactions.save,
        }

        return weights[interactionType] || Params.weights.interactions.default
    }

    private async collectUserData(userId: bigint): Promise<UserEmbeddingProps> {
        // Coleta todos os dados necessários para gerar um embedding

        const interactions = await InteractionEvent.findAll({
            where: { userId: userId.toString() },
            limit: 500,
            order: [['timestamp', 'DESC']]
        })

        const mappedInteractions = interactions.map(interaction => interaction.toUserInteraction())
        
        // Implementação simplificada para exemplo
        return {
            interactionHistory: mappedInteractions,
            viewingPatterns: [], // Obter de um serviço real
            contentPreferences: [], // Obter de um serviço real
        }
    }

    private async generateInteractionEmbedding(interactionFeatures: Record<string, any>): Promise<number[]> {
        await this.loadModel() // Garante que o modelo está carregado
        
        if (!this.embeddingPipeline) {
            throw new Error("Modelo não inicializado")
        }

        try {
            // Converter as features em texto para o modelo processar
            const interactionText = this.prepareInteractionTextForEmbedding(interactionFeatures)
            
            const output = await this.embeddingPipeline(interactionText, {
                pooling: 'mean',
                normalize: true
            })

            // Converter o tensor em array e garantir que são números
            const embedding = Array.from(output.data).map(val => Number(val))
            return normalizeL2(embedding)
        } catch (error) {
            this.logger.error(`Erro ao gerar embedding de interação: ${error}`)
            // Fallback para o método anterior em caso de erro
            const featureVector: number[] = Object.values(interactionFeatures)
                .filter((val) => typeof val === "number") as number[]
            
            const resized = resizeVector(featureVector, this.dimension)
            return normalizeL2(resized)
        }
    }

    private prepareInteractionTextForEmbedding(features: Record<string, any>): string {
        const parts: string[] = []

        // Adicionar tipo de interação
        if (features.interactionType) {
            parts.push(`Tipo de interação: ${features.interactionType}`)
        }

        // Adicionar metadados
        const metadataEntries = Object.entries(features)
            .filter(([key]) => key.startsWith('meta_'))
            .map(([key, value]) => `${key.replace('meta_', '')}: ${value}`)

        if (metadataEntries.length > 0) {
            parts.push(`Metadados: ${metadataEntries.join(", ")}`)
        }

        // Combinar todas as partes em um texto
        return parts.join("\n")
    }

    private extractInteractionFeatures(interaction: UserInteraction): Record<string, any> {
        // Extrai características relevantes de uma interação
        const features: Record<string, any> = {
            interactionType: interaction.type,
            // Poderia ter mais informações como tempo gasto, completude, etc.
        }

        // Adicionar outros dados se disponíveis no metadata
        if (interaction.metadata) {
            Object.entries(interaction.metadata).forEach(([key, value]) => {
                features[`meta_${key}`] = value
            })
        }

        return features
    }

    private async saveUserEmbedding(userId: bigint, vector: number[]): Promise<void> {
        try {
            const existingEmbedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() },
            })

            // Certifique-se de que o vetor é serializado corretamente
            const vectorData = JSON.stringify({
                values: vector,
                dimension: this.dimension,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            this.logger.info(`Salvando embedding com ${vector.length} dimensões para usuário ${userId}`)
            
            const metadata = {
                source: "interaction_based",
                modelVersion: this.embeddingPipeline ? this.MODEL_ID : "fallback_v1",
                lastUpdated: new Date().toISOString(),
            }

            if (existingEmbedding) {
                await existingEmbedding.update({
                    vector: vectorData,
                    metadata: metadata,
                })
                this.logger.info(`Embedding atualizado para usuário ${userId}`)
            } else {
                await UserEmbedding.create({
                    userId: userId.toString(),
                    vector: vectorData,
                    dimension: this.dimension,
                    metadata: metadata,
                })
                this.logger.info(`Novo embedding criado para usuário ${userId}`)
            }
        } catch (error: any) {
            this.logger.error(`Erro ao salvar embedding do usuário ${userId}: ${error.message}`)
        }
    }

    public async build(data: UserEmbeddingProps): Promise<EmbeddingVector> {
        try {
            // Validar dados
            if (!this.validateData(data)) {
                throw new Error("Dados inválidos para construção do embedding")
            }

            // Garantir que o modelo está carregado
            await this.loadModel()
            
            if (!this.embeddingPipeline) {
                throw new Error("Modelo não inicializado")
            }

            // 1. Gerar embedding usando o modelo ML
            const userText = this.prepareUserTextForEmbedding(data)
            const output = await this.embeddingPipeline(userText, {
                pooling: 'mean',
                normalize: true
            })
            const modelEmbedding = Array.from(output.data).map(val => Number(val))

            // 2. Processar histórico de interações
            const interactionFeatures = data.interactionHistory.map(interaction => {
                const features = this.extractInteractionFeatures(interaction)
                return Object.values(features)
                    .filter(val => typeof val === "number") as number[]
            }).flat()

            // 3. Processar padrões de visualização
            const viewingFeatures = data.viewingPatterns.map(pattern => [
                pattern.averageDuration / 100,
                pattern.completionRate,
                Math.min(pattern.frequency / 10, 1)
            ]).flat()

            // 4. Processar preferências de conteúdo
            const preferenceMap: Record<string, number> = {
                esportes: 0, música: 1, filmes: 2, notícias: 3,
                tecnologia: 4, comida: 5, viagem: 6, moda: 7,
                jogos: 8, arte: 9
            }
            const preferenceFeatures = new Array(Object.keys(preferenceMap).length).fill(0)
            data.contentPreferences.forEach(pref => {
                const index = preferenceMap[pref.toLowerCase()]
                if (index !== undefined) preferenceFeatures[index] = 1
            })

            // 5. Processar informações demográficas
            const demographicFeatures = this.processDemographicInfo(data.demographicInfo || {})

            // 6. Combinar todos os vetores
            const combinedFeatures = [
                ...modelEmbedding,          // Embedding do modelo ML
                ...interactionFeatures,     // Features de interação
                ...viewingFeatures,         // Features de visualização
                ...preferenceFeatures,      // Features de preferências
                ...demographicFeatures      // Features demográficas
            ]

            // 7. Redimensionar para a dimensão correta
            const resizedFeatures = resizeVector(combinedFeatures, this.dimension)

            // 8. Normalizar o vetor final
            const normalizedVector = normalizeL2(resizedFeatures)

            // 9. Criar o embedding final
            return {
                values: normalizedVector,
                dimension: this.dimension,
                metadata: {
                    modelVersion: this.MODEL_ID,
                    generatedAt: new Date().toISOString(),
                    interactionCount: data.interactionHistory.length,
                    dominantInterests: data.contentPreferences.slice(0, 5),
                    activenessFactor: this.calculateActivenessFactor(data.interactionHistory, {
                        daysToConsider: 30,
                        recencyWeight: 0.6,
                        frequencyWeight: 0.3,
                        diversityWeight: 0.1
                    })
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        } catch (error) {
            this.logger.error(`Erro ao construir embedding: ${error}`)
            throw error
        }
    }

    private validateData(data: UserEmbeddingProps): boolean {
        return (
            Array.isArray(data.interactionHistory) &&
            Array.isArray(data.viewingPatterns) &&
            Array.isArray(data.contentPreferences)
        )
    }

    private processDemographicInfo(demographics: any): number[] {
        const features = new Array(5).fill(0) // 5 features demográficas

        if (demographics.ageRange) {
            const ageMap: Record<string, number> = {
                "13-17": 0, "18-24": 0.2, "25-34": 0.4,
                "35-44": 0.6, "45-54": 0.8, "55+": 1
            }
            features[0] = ageMap[demographics.ageRange] || 0
        }

        return features
    }

    private calculateActivenessFactor(interactions: UserInteraction[], params:{
        daysToConsider: number,
        recencyWeight: number,
        frequencyWeight: number,
        diversityWeight: number
    }): number {
        if (!interactions.length) return 0

        const now = new Date()
        const DAYS_TO_CONSIDER = params.daysToConsider
        const RECENCY_WEIGHT = params.recencyWeight
        const FREQUENCY_WEIGHT = params.frequencyWeight
        const DIVERSITY_WEIGHT = params.diversityWeight

        // Filtrar interações dos últimos DAYS_TO_CONSIDER dias
        const recentInteractions = interactions.filter(interaction => {
            const interactionDate = new Date(interaction.timestamp)
            const daysDifference = (now.getTime() - interactionDate.getTime()) / (1000 * 60 * 60 * 24)
            return daysDifference <= DAYS_TO_CONSIDER
        })

        if (!recentInteractions.length) return 0

        // 1. Calcular fator de recência
        const recencyFactor = this.calculateRecencyFactor(recentInteractions, now)

        // 2. Calcular fator de frequência
        const frequencyFactor = this.calculateFrequencyFactor(recentInteractions, DAYS_TO_CONSIDER)

        // 3. Calcular fator de diversidade
        const diversityFactor = this.calculateDiversityFactor(recentInteractions)

        // Combinar os fatores com seus respectivos pesos
        const activenessFactor = (
            recencyFactor * RECENCY_WEIGHT +
            frequencyFactor * FREQUENCY_WEIGHT +
            diversityFactor * DIVERSITY_WEIGHT
        )

        // Normalizar para um valor entre 0 e 1
        return Math.min(Math.max(activenessFactor, 0), 1)
    }

    private calculateRecencyFactor(interactions: UserInteraction[], now: Date): number {
        // Ordenar interações por data, mais recentes primeiro
        const sortedInteractions = [...interactions].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )

        // Calcular peso exponencial decrescente para cada interação
        const recencyScores = sortedInteractions.map((interaction, index) => {
            const interactionDate = new Date(interaction.timestamp)
            const daysDifference = (now.getTime() - interactionDate.getTime()) / (1000 * 60 * 60 * 24)
            // Decay exponencial baseado na diferença de dias
            return Math.exp(-daysDifference / 30) * Math.exp(-index / sortedInteractions.length)
        })

        // Retornar média dos scores de recência
        return recencyScores.reduce((acc, score) => acc + score, 0) / recencyScores.length
    }

    private calculateFrequencyFactor(interactions: UserInteraction[], daysToConsider: number): number {
        // Calcular média de interações por dia
        const interactionsPerDay = interactions.length / daysToConsider

        // Normalizar usando uma função logística para evitar valores extremos
        return 1 / (1 + Math.exp(-interactionsPerDay + 3))
    }

    private calculateDiversityFactor(interactions: UserInteraction[]): number {
        // Contar tipos únicos de interações
        const interactionTypes = new Set(interactions.map(i => i.type))
        const uniqueTypesCount = interactionTypes.size

        // Contar entidades únicas com as quais o usuário interagiu
        const uniqueEntities = new Set(interactions.map(i => i.entityId))
        const uniqueEntitiesCount = uniqueEntities.size

        // Pesos para diferentes aspectos da diversidade
        const TYPE_DIVERSITY_WEIGHT = 0.4
        const ENTITY_DIVERSITY_WEIGHT = 0.6

        // Normalizar contagens
        const typeDiversity = uniqueTypesCount / 5 // Assumindo 5 tipos possíveis de interação
        const entityDiversity = Math.min(uniqueEntitiesCount / 50, 1) // Cap em 50 entidades únicas

        return (
            typeDiversity * TYPE_DIVERSITY_WEIGHT +
            entityDiversity * ENTITY_DIVERSITY_WEIGHT
        )
    }

    /**
     * Atualiza os embeddings do usuário com base em novas interações
     */
    public async updateUserEmbeddings(userId: bigint): Promise<UserEmbeddingType> {
        try {
            this.logger.info(`Atualizando embeddings para usuário ${userId}`)

            // Buscar embedding atual
            const currentEmbedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() }
            })

            if (!currentEmbedding) {
                // Se não existir, gerar um novo
                return this.generateUserEmbedding(userId)
            }

            // Coletar dados atualizados do usuário
            const userData = await this.collectUserData(userId)

            // Gerar novo embedding
            const newVector = await this.generateEmbedding(userData)

            // Atualizar no banco
            await currentEmbedding.update({
                vector: JSON.stringify(newVector),
                metadata: {
                    ...currentEmbedding.metadata,
                    updatedAt: new Date().toISOString()
                }
            })

            return currentEmbedding.toUserEmbeddingType()
        } catch (error: any) {
            this.logger.error(`Erro ao atualizar embeddings do usuário ${userId}: ${error.message}`)
            throw error
        }
    }

    /**
     * Gera um embedding inicial para um novo usuário com base em dados de perfil
     * Útil para criar embeddings para usuários recém-registrados
     * 
     * @param userId ID do usuário
     * @param initialProfile Dados iniciais de perfil (opcional)
     * @returns O embedding gerado e salvo
     */
    public async generateInitialEmbedding(
        userId: bigint, 
        initialProfile?: {
            preferredLanguages?: string[];
            initialInterests?: string[];
            demographicInfo?: {
                ageRange?: string;
                location?: string;
            }
        }
    ): Promise<UserEmbeddingType> {
        try {
            this.logger.info(`Gerando embedding inicial para usuário ${userId}`)
            
            // Construir dados iniciais para o embedding
            const userData: UserEmbeddingProps = {
                interactionHistory: [], // Sem histórico de interações ainda
                viewingPatterns: [], // Sem padrões de visualização ainda
                contentPreferences: initialProfile?.initialInterests || [],
                demographicInfo: {
                    ageRange: initialProfile?.demographicInfo?.ageRange || "",
                    location: initialProfile?.demographicInfo?.location || "",
                    languages: initialProfile?.preferredLanguages || [],
                    interests: initialProfile?.initialInterests || []
                }
            }
            
            // Gerar embedding
            const embedding = await this.build(userData)
            
            // Salvar no banco de dados
            const metadata = {
                source: "initial_registration",
                modelVersion: this.embeddingPipeline ? this.MODEL_ID : "fallback_v1",
                lastUpdated: new Date().toISOString(),
                initialProfile: initialProfile ? true : false
            }
            
            // Verificar se já existe um embedding para este usuário
            const existingEmbedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() }
            })
            
            // Serializar o vetor
            const vectorData = JSON.stringify({
                values: embedding.values,
                dimension: this.dimension,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            
            if (existingEmbedding) {
                await existingEmbedding.update({
                    vector: vectorData,
                    metadata: {
                        ...existingEmbedding.metadata,
                        ...metadata
                    }
                })
                this.logger.info(`Embedding inicial atualizado para usuário ${userId}`)
            } else {
                await UserEmbedding.create({
                    userId: userId.toString(),
                    vector: vectorData,
                    dimension: this.dimension,
                    metadata: metadata
                })
                this.logger.info(`Embedding inicial criado para usuário ${userId}`)
            }
            
            // Retornar o embedding
            const savedEmbedding = await UserEmbedding.findOne({
                where: { userId: userId.toString() }
            })
            
            if (!savedEmbedding) {
                throw new Error(`Erro ao recuperar embedding recém-salvo para usuário ${userId}`)
            }
            
            return savedEmbedding.toUserEmbeddingType()
        } catch (error: any) {
            this.logger.error(`Erro ao gerar embedding inicial para usuário ${userId}: ${error.message}`)
            return this.generateFallbackEmbedding(userId, error.message)
        }
    }
}
