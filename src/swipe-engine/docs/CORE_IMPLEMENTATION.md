# Detalhamento da Camada Core do Sistema de Recomendação com SimClusters

## 1. Core/Embeddings

### 1.1 BaseEmbeddingService.ts

**Classe: BaseEmbeddingService (Abstrata)**

```typescript
abstract class BaseEmbeddingService {
    protected dimension: number
    protected modelPath: string
    protected modelLoaded: boolean = false
    protected model: any // Referência ao modelo de embeddings carregado

    constructor(dimension: number, modelPath: string) {
        this.dimension = dimension
        this.modelPath = modelPath
    }

    // Métodos abstratos que devem ser implementados por classes filhas
    abstract generateEmbedding(input: any): Promise<number[]>
    abstract updateEmbedding(currentEmbedding: number[], newData: any): Promise<number[]>

    // Métodos comuns para todos os serviços de embedding
    protected async loadModel(): Promise<void> {
        if (!this.modelLoaded) {
            try {
                // Lógica para carregar o modelo (específica para cada implementação)
                this.model = await this.loadModelImplementation()
                this.modelLoaded = true
                logger.info(`Modelo de embedding carregado: ${this.modelPath}`)
            } catch (error) {
                logger.error(`Erro ao carregar modelo de embedding: ${error.message}`)
                throw new Error(`Falha ao carregar modelo de embedding: ${error.message}`)
            }
        }
    }

    protected abstract loadModelImplementation(): Promise<any>

    protected normalize(vector: number[]): number[] {
        // Normalização L2 (euclidiana)
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
        if (magnitude === 0) {
            return new Array(vector.length).fill(0)
        }
        return vector.map((val) => val / magnitude)
    }

    protected validateDimension(vector: number[]): void {
        if (vector.length !== this.dimension) {
            throw new Error(
                `Dimensão inválida: esperado ${this.dimension}, recebido ${vector.length}`
            )
        }
    }

    // Método para persistência de embeddings
    protected async saveEmbedding(
        entityId: string | bigint,
        embedding: number[],
        metadata?: any
    ): Promise<void> {
        // Lógica para salvar o embedding no banco de dados
        // Isso pode ser sobrescrito por classes filhas se necessário
    }

    // Método para recuperação de embeddings
    protected async getStoredEmbedding(entityId: string | bigint): Promise<number[] | null> {
        // Lógica para recuperar um embedding do banco de dados
        // Isso pode ser sobrescrito por classes filhas se necessário
        return null
    }
}
```

### 1.2 UserEmbeddingService.ts

**Classe: UserEmbeddingService**

```typescript
class UserEmbeddingService extends BaseEmbeddingService {
    private userRepository: UserRepository
    private interactionRepository: InteractionRepository
    private userEmbeddingRepository: UserEmbeddingRepository

    constructor(
        dimension: number = 128,
        modelPath: string = "models/user_embedding_model",
        userRepository: UserRepository,
        interactionRepository: InteractionRepository,
        userEmbeddingRepository: UserEmbeddingRepository
    ) {
        super(dimension, modelPath)
        this.userRepository = userRepository
        this.interactionRepository = interactionRepository
        this.userEmbeddingRepository = userEmbeddingRepository
    }

    // Implementação do método abstrato para carregar o modelo
    protected async loadModelImplementation(): Promise<any> {
        // Pode usar TensorFlow.js, ONNX Runtime ou outro framework
        // Exemplo com TensorFlow.js:
        return await tf.loadLayersModel(`file://${this.modelPath}`)
    }

    // Gera embedding do usuário a partir de seus dados
    async generateEmbedding(userData: UserEmbeddingProps): Promise<number[]> {
        await this.loadModel() // Garante que o modelo está carregado

        const { interactionHistory, viewingPatterns, contentPreferences, demographicInfo } =
            userData

        // 1. Processar histórico de interações
        const interactionFeatures = this.processInteractionHistory(interactionHistory)

        // 2. Processar padrões de visualização
        const viewingFeatures = this.processViewingPatterns(viewingPatterns)

        // 3. Processar preferências de conteúdo
        const preferenceFeatures = this.processContentPreferences(contentPreferences)

        // 4. Processar informações demográficas (opcional)
        const demographicFeatures = demographicInfo
            ? this.processDemographicInfo(demographicInfo)
            : []

        // 5. Combinar todos os vetores de características
        const combinedFeatures = [
            ...interactionFeatures,
            ...viewingFeatures,
            ...preferenceFeatures,
            ...demographicFeatures,
        ]

        // 6. Caso o vetor combinado não tenha a dimensão correta, redimensionar
        const resizedFeatures = this.resizeFeatureVector(combinedFeatures, this.dimension)

        // 7. Usar o modelo para gerar o embedding final
        const embeddingTensor = this.model.predict(tf.tensor([resizedFeatures]))
        const embedding = await embeddingTensor.array()
        embeddingTensor.dispose() // Liberar memória do tensor

        // 8. Normalizar o embedding resultante
        return this.normalize(embedding[0])
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
        return this.normalize(updatedEmbedding)
    }

    // Recupera ou gera o embedding para um usuário
    async getUserEmbedding(userId: bigint): Promise<number[]> {
        try {
            // 1. Tentar recuperar embedding existente
            const storedEmbedding = await this.userEmbeddingRepository.findByUserId(userId)

            // 2. Se existir e for recente (menos de X dias), retornar
            if (storedEmbedding && this.isEmbeddingRecent(storedEmbedding.lastUpdated)) {
                return storedEmbedding.embedding
            }

            // 3. Se não existir ou for antigo, gerar um novo
            // 3.1 Buscar dados do usuário
            const userData = await this.collectUserData(userId)

            // 3.2 Gerar novo embedding
            const newEmbedding = await this.generateEmbedding(userData)

            // 3.3 Persistir o novo embedding
            await this.userEmbeddingRepository.saveOrUpdate({
                userId,
                embedding: newEmbedding,
                lastUpdated: new Date(),
                version: storedEmbedding ? storedEmbedding.version + 1 : 1,
                metadata: this.generateEmbeddingMetadata(userData, newEmbedding),
            })

            return newEmbedding
        } catch (error) {
            logger.error(`Erro ao obter embedding do usuário ${userId}: ${error.message}`)
            throw new Error(`Falha ao obter embedding do usuário: ${error.message}`)
        }
    }

    // Métodos auxiliares

    private processInteractionHistory(interactions: UserInteraction[]): number[] {
        // Processamento do histórico de interações para extração de características
        // Isso pode incluir agregações, ponderações por recência, etc.
    }

    private processViewingPatterns(patterns: ViewMetrics[]): number[] {
        // Processamento dos padrões de visualização para extração de características
    }

    private processContentPreferences(preferences: string[]): number[] {
        // Processamento das preferências de conteúdo para extração de características
    }

    private processDemographicInfo(demographics: UserDemographics): number[] {
        // Processamento das informações demográficas para extração de características
    }

    private resizeFeatureVector(vector: number[], targetSize: number): number[] {
        // Redimensiona o vetor para o tamanho desejado (compressão ou expansão)
    }

    private async generateInteractionEmbedding(features: any): Promise<number[]> {
        // Gera um embedding para uma interação específica
    }

    private getInteractionWeight(interactionType: string): number {
        // Determina o peso de uma interação com base em seu tipo
        const weights = {
            view: 0.05,
            like: 0.2,
            comment: 0.3,
            share: 0.4,
            save: 0.35,
            follow: 0.25,
            block: 0.5,
            report: 0.6,
        }
        return weights[interactionType] || 0.1 // Peso padrão para tipos desconhecidos
    }

    private isEmbeddingRecent(lastUpdated: Date): boolean {
        const maxAgeInDays = 7 // Configurável
        const ageInDays = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
        return ageInDays < maxAgeInDays
    }

    private async collectUserData(userId: bigint): Promise<UserEmbeddingProps> {
        // Coleta todos os dados necessários do usuário para geração do embedding
        const user = await this.userRepository.findById(userId)
        const interactions = await this.interactionRepository.findByUserId(userId, 1000) // Últimas 1000 interações
        const viewMetrics = await this.userRepository.getViewingMetrics(userId)
        const preferences = await this.userRepository.getContentPreferences(userId)

        return {
            interactionHistory: interactions,
            viewingPatterns: viewMetrics,
            contentPreferences: preferences,
            demographicInfo: user.demographics,
        }
    }

    private generateEmbeddingMetadata(userData: UserEmbeddingProps, embedding: number[]): any {
        // Gera metadados para o embedding, como interesses dominantes
        return {
            dominantInterests: this.extractDominantInterests(userData, embedding),
            activenessFactor: this.calculateActivenessFactor(userData.interactionHistory),
            embedDimensions: {
                interactionDim: Math.floor(this.dimension * 0.6), // 60% para interações
                contentPrefDim: Math.floor(this.dimension * 0.3), // 30% para preferências de conteúdo
                socialDim: Math.floor(this.dimension * 0.1), // 10% para dimensão social
            },
        }
    }

    private extractDominantInterests(userData: UserEmbeddingProps, embedding: number[]): string[] {
        // Extrai os interesses dominantes do usuário com base no embedding
    }

    private calculateActivenessFactor(interactions: UserInteraction[]): number {
        // Calcula o fator de atividade do usuário com base em suas interações
    }
}
```

### 1.3 PostEmbeddingService.ts

**Classe: PostEmbeddingService**

```typescript
class PostEmbeddingService extends BaseEmbeddingService {
    private textEmbeddingService: TextEmbeddingService
    private engagementEmbeddingService: EngagementEmbeddingService
    private postRepository: PostRepository
    private postEmbeddingRepository: PostEmbeddingRepository

    constructor(
        dimension: number = 256,
        modelPath: string = "models/post_embedding_model",
        textEmbeddingService: TextEmbeddingService,
        engagementEmbeddingService: EngagementEmbeddingService,
        postRepository: PostRepository,
        postEmbeddingRepository: PostEmbeddingRepository
    ) {
        super(dimension, modelPath)
        this.textEmbeddingService = textEmbeddingService
        this.engagementEmbeddingService = engagementEmbeddingService
        this.postRepository = postRepository
        this.postEmbeddingRepository = postEmbeddingRepository
    }

    protected async loadModelImplementation(): Promise<any> {
        // Carregar modelo específico para posts, se necessário
        // Em muitos casos, o embedding de post pode ser uma combinação de outros embeddings
        // sem necessidade de um modelo separado
        return null
    }

    async generateEmbedding(postData: PostEmbeddingProps): Promise<number[]> {
        const { textContent, tags, engagementMetrics, authorId, createdAt } = postData

        // 1. Gerar embedding do texto e tags
        const textEmbedding = await this.textEmbeddingService.embedText(textContent, tags)

        // 2. Gerar embedding das métricas de engajamento
        const engagementEmbedding = await this.engagementEmbeddingService.embedEngagement(
            engagementMetrics
        )

        // 3. Gerar embedding temporal (recência)
        const temporalEmbedding = this.generateTemporalEmbedding(createdAt)

        // 4. Gerar embedding do autor (opcional, pode ser usado para correlacionar com criador)
        const authorEmbedding = await this.generateAuthorComponent(authorId)

        // 5. Combinar todos os embeddings com pesos apropriados
        const combinedEmbedding = this.combineEmbeddings({
            textEmbedding,
            engagementEmbedding,
            temporalEmbedding,
            authorEmbedding,
        })

        // 6. Normalizar o embedding resultante
        return this.normalize(combinedEmbedding)
    }

    async updateEmbedding(
        currentEmbedding: number[],
        newStats: UpdatedPostStats
    ): Promise<number[]> {
        // 1. Extrair os componentes do embedding atual
        const components = this.extractEmbeddingComponents(currentEmbedding)

        // 2. Atualizar apenas o componente de engajamento
        const updatedEngagementEmbedding =
            await this.engagementEmbeddingService.updateEngagementEmbedding(
                components.engagementEmbedding,
                newStats
            )

        // 3. Atualizar o componente temporal se necessário
        const updatedTemporalEmbedding = newStats.lastInteraction
            ? this.updateTemporalEmbedding(components.temporalEmbedding, newStats.lastInteraction)
            : components.temporalEmbedding

        // 4. Recombinar os componentes
        const updatedEmbedding = this.combineEmbeddings({
            textEmbedding: components.textEmbedding,
            engagementEmbedding: updatedEngagementEmbedding,
            temporalEmbedding: updatedTemporalEmbedding,
            authorEmbedding: components.authorEmbedding,
        })

        // 5. Normalizar o embedding atualizado
        return this.normalize(updatedEmbedding)
    }

    async getPostEmbedding(postId: bigint): Promise<number[]> {
        try {
            // 1. Tentar recuperar embedding existente
            const storedEmbedding = await this.postEmbeddingRepository.findByPostId(postId)

            // 2. Se existir, retornar
            if (storedEmbedding) {
                // Verificar se atualização de engajamento é necessária
                if (this.needsEngagementUpdate(storedEmbedding.updatedAt)) {
                    // Buscar estatísticas de engajamento atualizadas
                    const currentEngagementStats = await this.postRepository.getEngagementStats(
                        postId
                    )

                    // Atualizar o componente de engajamento
                    const updatedEmbedding = await this.updateEmbedding(storedEmbedding.embedding, {
                        engagementMetrics: currentEngagementStats,
                    })

                    // Persistir o embedding atualizado
                    await this.postEmbeddingRepository.update({
                        postId,
                        embedding: updatedEmbedding,
                        updatedAt: new Date(),
                        components: {
                            ...storedEmbedding.components,
                            engagementEmbedding:
                                await this.engagementEmbeddingService.embedEngagement(
                                    currentEngagementStats
                                ),
                        },
                    })

                    return updatedEmbedding
                }

                return storedEmbedding.embedding
            }

            // 3. Se não existir, gerar um novo
            // 3.1 Buscar dados do post
            const postData = await this.collectPostData(postId)

            // 3.2 Gerar novo embedding
            const newEmbedding = await this.generateEmbedding(postData)

            // 3.3 Extrair componentes para armazenamento
            const components = {
                textEmbedding: await this.textEmbeddingService.embedText(
                    postData.textContent,
                    postData.tags
                ),
                engagementEmbedding: await this.engagementEmbeddingService.embedEngagement(
                    postData.engagementMetrics
                ),
                temporalEmbedding: this.generateTemporalEmbedding(postData.createdAt),
                authorEmbedding: await this.generateAuthorComponent(postData.authorId),
            }

            // 3.4 Persistir o novo embedding
            await this.postEmbeddingRepository.save({
                postId,
                embedding: newEmbedding,
                createdAt: new Date(),
                updatedAt: new Date(),
                components,
                metadata: this.generatePostEmbeddingMetadata(postData),
            })

            return newEmbedding
        } catch (error) {
            logger.error(`Erro ao obter embedding do post ${postId}: ${error.message}`)
            throw new Error(`Falha ao obter embedding do post: ${error.message}`)
        }
    }

    // Métodos auxiliares

    private combineEmbeddings(components: {
        textEmbedding: number[]
        engagementEmbedding: number[]
        temporalEmbedding: number[]
        authorEmbedding: number[]
    }): number[] {
        // Define os pesos para cada componente
        const weights = {
            text: 0.65, // 65% para conteúdo textual e tags
            engagement: 0.25, // 25% para métricas de engajamento
            temporal: 0.05, // 5% para recência
            author: 0.05, // 5% para o autor
        }

        // Redimensiona cada componente para o tamanho apropriado
        const textDim = Math.floor(this.dimension * weights.text)
        const engagementDim = Math.floor(this.dimension * weights.engagement)
        const temporalDim = Math.floor(this.dimension * weights.temporal)
        const authorDim = this.dimension - textDim - engagementDim - temporalDim // Restante

        const resizedText = this.resizeVector(components.textEmbedding, textDim)
        const resizedEngagement = this.resizeVector(components.engagementEmbedding, engagementDim)
        const resizedTemporal = this.resizeVector(components.temporalEmbedding, temporalDim)
        const resizedAuthor = this.resizeVector(components.authorEmbedding, authorDim)

        // Concatena os componentes redimensionados
        return [...resizedText, ...resizedEngagement, ...resizedTemporal, ...resizedAuthor]
    }

    private extractEmbeddingComponents(embedding: number[]): {
        textEmbedding: number[]
        engagementEmbedding: number[]
        temporalEmbedding: number[]
        authorEmbedding: number[]
    } {
        // Define as proporções de cada componente (deve corresponder às proporções em combineEmbeddings)
        const weights = {
            text: 0.65,
            engagement: 0.25,
            temporal: 0.05,
            author: 0.05,
        }

        // Calcula as dimensões de cada componente
        const textDim = Math.floor(this.dimension * weights.text)
        const engagementDim = Math.floor(this.dimension * weights.engagement)
        const temporalDim = Math.floor(this.dimension * weights.temporal)
        const authorDim = this.dimension - textDim - engagementDim - temporalDim

        // Extrai cada componente
        let start = 0
        const textEmbedding = embedding.slice(start, start + textDim)

        start += textDim
        const engagementEmbedding = embedding.slice(start, start + engagementDim)

        start += engagementDim
        const temporalEmbedding = embedding.slice(start, start + temporalDim)

        start += temporalDim
        const authorEmbedding = embedding.slice(start, start + authorDim)

        return {
            textEmbedding,
            engagementEmbedding,
            temporalEmbedding,
            authorEmbedding,
        }
    }

    private generateTemporalEmbedding(timestamp: Date): number[] {
        // Gera um embedding baseado na temporalidade (recência) do post
        const now = new Date()
        const ageInDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24)

        // Implementação simples: decaimento exponencial
        const temporalFactor = Math.exp(-0.05 * ageInDays) // Decai ~5% por dia

        // Cria um vetor unidimensional com o fator temporal
        return [temporalFactor]
    }

    private updateTemporalEmbedding(currentTemporal: number[], newTimestamp: Date): number[] {
        // Atualiza o embedding temporal com base em uma nova interação
        return this.generateTemporalEmbedding(newTimestamp)
    }

    private async generateAuthorComponent(authorId: bigint): Promise<number[]> {
        // Gera um componente baseado no autor do post
        // Isso pode ser uma versão reduzida do embedding do autor
        try {
            const userEmbeddingService = Container.get(UserEmbeddingService)
            const authorEmbedding = await userEmbeddingService.getUserEmbedding(authorId)

            // Usamos apenas uma versão reduzida do embedding do autor
            return this.resizeVector(authorEmbedding, 16) // Reduz para 16 dimensões
        } catch (error) {
            logger.warn(`Não foi possível obter embedding do autor ${authorId}: ${error.message}`)
            // Retorna um vetor de zeros se não conseguir obter o embedding do autor
            return new Array(16).fill(0)
        }
    }

    private resizeVector(vector: number[], targetSize: number): number[] {
        if (vector.length === targetSize) {
            return vector
        }

        if (vector.length > targetSize) {
            // Redução de dimensionalidade simples: média dos segmentos
            const result = new Array(targetSize).fill(0)
            const segmentSize = vector.length / targetSize

            for (let i = 0; i < targetSize; i++) {
                const start = Math.floor(i * segmentSize)
                const end = Math.floor((i + 1) * segmentSize)
                let sum = 0

                for (let j = start; j < end; j++) {
                    sum += vector[j]
                }

                result[i] = sum / (end - start)
            }

            return result
        } else {
            // Expansão de dimensionalidade: interpolação linear
            const result = new Array(targetSize).fill(0)
            const scaleFactor = (vector.length - 1) / (targetSize - 1)

            for (let i = 0; i < targetSize; i++) {
                const exactIndex = i * scaleFactor
                const lowerIndex = Math.floor(exactIndex)
                const upperIndex = Math.min(Math.ceil(exactIndex), vector.length - 1)

                if (lowerIndex === upperIndex) {
                    result[i] = vector[lowerIndex]
                } else {
                    const weight = exactIndex - lowerIndex
                    result[i] = vector[lowerIndex] * (1 - weight) + vector[upperIndex] * weight
                }
            }

            return result
        }
    }

    private async collectPostData(postId: bigint): Promise<PostEmbeddingProps> {
        // Coleta todos os dados necessários do post para geração do embedding
        const post = await this.postRepository.findById(postId)
        const engagementStats = await this.postRepository.getEngagementStats(postId)

        return {
            textContent: post.content,
            tags: post.tags || [],
            engagementMetrics: engagementStats,
            authorId: post.authorId,
            createdAt: post.createdAt,
        }
    }

    private needsEngagementUpdate(lastUpdated: Date): boolean {
        const updateIntervalHours = 6 // Atualizar a cada 6 horas
        const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60)
        return hoursSinceUpdate >= updateIntervalHours
    }

    private generatePostEmbeddingMetadata(postData: PostEmbeddingProps): any {
        return {
            dominantTopics: this.extractDominantTopics(postData),
            contentLength: postData.textContent.length,
            mediaType: this.detectMediaType(postData),
            creationTime: postData.createdAt,
        }
    }

    private extractDominantTopics(postData: PostEmbeddingProps): string[] {
        // Extrai os tópicos dominantes do post
        // Em implementação simples, pode ser apenas as tags
        return postData.tags.slice(0, 5) // Top 5 tags
    }

    private detectMediaType(postData: PostEmbeddingProps): string {
        // Detecta o tipo de mídia principal do post
        // Isso pode ser baseado em campos adicionais no postData
        return "text" // Exemplo simples
    }
}
```

### 1.4 normalization.ts

```typescript
/**
 * Realiza normalização L2 (euclidiana) em um vetor
 * @param vector Vetor de entrada para normalizar
 * @returns Vetor normalizado
 */
export function normalizeL2(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    if (magnitude === 0) {
        return new Array(vector.length).fill(0)
    }
    return vector.map((val) => val / magnitude)
}

/**
 * Realiza normalização min-max em um vetor
 * @param vector Vetor de entrada para normalizar
 * @param min Valor mínimo para o resultado (padrão: 0)
 * @param max Valor máximo para o resultado (padrão: 1)
 * @returns Vetor normalizado
 */
export function normalizeMinMax(vector: number[], min: number = 0, max: number = 1): number[] {
    const minVal = Math.min(...vector)
    const maxVal = Math.max(...vector)

    if (maxVal - minVal === 0) {
        return new Array(vector.length).fill((max + min) / 2)
    }

    return vector.map((val) => {
        return min + ((val - minVal) * (max - min)) / (maxVal - minVal)
    })
}

/**
 * Realiza normalização Z-score em um vetor (média 0, desvio padrão 1)
 * @param vector Vetor de entrada para normalizar
 * @returns Vetor normalizado
 */
export function normalizeZScore(vector: number[]): number[] {
    // Calcula a média
    const mean = vector.reduce((sum, val) => sum + val, 0) / vector.length

    // Calcula o desvio padrão
    const variance = vector.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vector.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) {
        return new Array(vector.length).fill(0)
    }

    return vector.map((val) => (val - mean) / stdDev)
}

/**
 * Normaliza um vetor usando softmax para criar uma distribuição de probabilidade
 * @param vector Vetor de entrada para normalizar
 * @returns Vetor normalizado onde a soma de todos os elementos é 1
 */
export function normalizeSoftmax(vector: number[]): number[] {
    // Ajusta para estabilidade numérica (evita overflow)
    const maxVal = Math.max(...vector)
    const expValues = vector.map((val) => Math.exp(val - maxVal))

    const sumExp = expValues.reduce((sum, val) => sum + val, 0)

    return expValues.map((val) => val / sumExp)
}

/**
 * Normaliza a magnitude de um vetor para um valor específico
 * @param vector Vetor de entrada para normalizar
 * @param targetMagnitude Magnitude desejada (padrão: 1.0)
 * @returns Vetor normalizado
 */
export function normalizeToMagnitude(vector: number[], targetMagnitude: number = 1.0): number[] {
    const currentMagnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))

    if (currentMagnitude === 0) {
        return new Array(vector.length).fill(0)
    }

    const scaleFactor = targetMagnitude / currentMagnitude
    return vector.map((val) => val * scaleFactor)
}
```

### 1.5 vector-operations.ts

```typescript
/**
 * Calcula a similaridade do cosseno entre dois vetores
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @returns Valor da similaridade do cosseno (entre -1 e 1)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error("Os vetores devem ter o mesmo tamanho")
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i]
        normA += vecA[i] * vecA[i]
        normB += vecB[i] * vecB[i]
    }

    const normProduct = Math.sqrt(normA) * Math.sqrt(normB)

    if (normProduct === 0) {
        return 0 // Vetores de magnitude zero
    }

    return dotProduct / normProduct
}

/**
 * Calcula a distância euclidiana entre dois vetores
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @returns Distância euclidiana
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error("Os vetores devem ter o mesmo tamanho")
    }

    let sumSquaredDiff = 0

    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i]
        sumSquaredDiff += diff * diff
    }

    return Math.sqrt(sumSquaredDiff)
}

/**
 * Calcula a distância de Manhattan entre dois vetores
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @returns Distância de Manhattan
 */
export function manhattanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error("Os vetores devem ter o mesmo tamanho")
    }

    let sum = 0

    for (let i = 0; i < vecA.length; i++) {
        sum += Math.abs(vecA[i] - vecB[i])
    }

    return sum
}

/**
 * Calcula o produto escalar (dot product) entre dois vetores
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @returns Produto escalar
 */
export function dotProduct(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error("Os vetores devem ter o mesmo tamanho")
    }

    let product = 0

    for (let i = 0; i < vecA.length; i++) {
        product += vecA[i] * vecB[i]
    }

    return product
}

/**
 * Combina vetores com pesos opcionais
 * @param vectors Lista de vetores a serem combinados
 * @param weights Pesos para cada vetor (opcional, padrão: pesos iguais)
 * @returns Vetor combinado
 */
export function combineVectors(vectors: number[][], weights?: number[]): number[] {
    if (vectors.length === 0) {
        return []
    }

    const dimension = vectors[0].length

    // Verifica se todos os vetores têm a mesma dimensão
    for (const vec of vectors) {
        if (vec.length !== dimension) {
            throw new Error("Todos os vetores devem ter a mesma dimensão")
        }
    }

    // Prepara os pesos
    const finalWeights = weights || vectors.map(() => 1 / vectors.length)

    if (finalWeights.length !== vectors.length) {
        throw new Error("O número de pesos deve ser igual ao número de vetores")
    }

    // Combina os vetores
    const result = new Array(dimension).fill(0)

    for (let i = 0; i < vectors.length; i++) {
        const vector = vectors[i]
        const weight = finalWeights[i]

        for (let j = 0; j < dimension; j++) {
            result[j] += vector[j] * weight
        }
    }

    return result
}

/**
 * Faz uma interpolação linear entre dois vetores
 * @param vecA Vetor inicial
 * @param vecB Vetor final
 * @param t Fator de interpolação (0 = vecA, 1 = vecB)
 * @returns Vetor interpolado
 */
export function lerp(vecA: number[], vecB: number[], t: number): number[] {
    if (vecA.length !== vecB.length) {
        throw new Error("Os vetores devem ter o mesmo tamanho")
    }

    const result = new Array(vecA.length)

    for (let i = 0; i < vecA.length; i++) {
        result[i] = vecA[i] * (1 - t) + vecB[i] * t
    }

    return result
}

/**
 * Redimensiona um vetor para um tamanho diferente usando interpolação
 * @param vector Vetor original
 * @param newSize Novo tamanho
 * @returns Vetor redimensionado
 */
export function resizeVector(vector: number[], newSize: number): number[] {
    if (vector.length === newSize) {
        return [...vector]
    }

    const result = new Array(newSize)

    if (vector.length > newSize) {
        // Redução: usamos média dos segmentos
        const ratio = vector.length / newSize

        for (let i = 0; i < newSize; i++) {
            const start = Math.floor(i * ratio)
            const end = Math.floor((i + 1) * ratio)
            let sum = 0

            for (let j = start; j < end; j++) {
                sum += vector[j]
            }

            result[i] = sum / (end - start)
        }
    } else {
        // Expansão: usamos interpolação linear
        const ratio = (vector.length - 1) / (newSize - 1)

        for (let i = 0; i < newSize; i++) {
            const idx = i * ratio
            const lowerIdx = Math.floor(idx)
            const upperIdx = Math.min(Math.ceil(idx), vector.length - 1)

            if (lowerIdx === upperIdx) {
                result[i] = vector[lowerIdx]
            } else {
                const weight = idx - lowerIdx
                result[i] = vector[lowerIdx] * (1 - weight) + vector[upperIdx] * weight
            }
        }
    }

    return result
}

/**
 * Converte vetor de embeddings para um formato compacto para armazenamento
 * @param vector Vetor de embedding
 * @returns String compacta representando o vetor
 */
export function vectorToCompactString(vector: number[]): string {
    // Utiliza precisão limitada e codificação eficiente
    return vector.map((v) => v.toFixed(5)).join(",")
}

/**
 * Converte string compacta de volta para vetor de embedding
 * @param str String compacta representando um vetor
 * @returns Vetor reconstruído
 */
export function compactStringToVector(str: string): number[] {
    return str.split(",").map((s) => parseFloat(s))
}
```
