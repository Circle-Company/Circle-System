# 🚀 Nova Arquitetura para Swipe Engine com SimClusters

## Visão Geral

Este documento propõe uma nova arquitetura para o Swipe Engine utilizando o conceito de SimClusters para posts e usuários. Esta abordagem visa melhorar a relevância das recomendações, aumentar o engajamento dos usuários e otimizar o desempenho do sistema.

## O que são SimClusters?

SimClusters é uma técnica de agrupamento de similaridade que identifica e agrupa entidades (usuários ou posts) com características e comportamentos semelhantes. Diferentemente dos métodos tradicionais de recomendação:

-   Organiza usuários e conteúdos em clusters (grupos) baseados em padrões de interação
-   Permite recomendações em tempo real com menor complexidade computacional
-   Facilita a descoberta de conteúdo relevante mesmo com dados esparsos

## Entendendo os Clusters em Profundidade

### O que é um Cluster?

Um cluster é um agrupamento de entidades (usuários ou posts) que compartilham características semelhantes no espaço de embeddings. Em termos matemáticos:

-   **Definição formal**: Um conjunto de pontos no espaço N-dimensional onde a distância interna entre os membros é significativamente menor que a distância para membros de outros clusters.
-   **Representação**: Cada cluster é representado por um centroide (vetor médio de todos os membros) e possui uma medida de coesão interna.
-   **Propriedades-chave**: Tamanho, densidade, formato e estabilidade ao longo do tempo.

```typescript
interface Cluster {
    id: string
    centroid: number[] // Vetor que representa o centro do cluster
    radius: number // Raio de abrangência do cluster
    members: EntityReference[] // Referências aos membros (posts ou usuários)
    size: number // Quantidade de membros
    createdAt: Date // Data de criação do cluster
    updatedAt: Date // Última atualização do cluster
    metrics: {
        cohesion: number // Medida de quão próximos estão os membros
        stability: number // Medida de quão estável o cluster é ao longo do tempo
        growth: number // Taxa de crescimento do cluster
    }
    metadata: {
        dominantTags?: string[] // Tags predominantes (para clusters de posts)
        dominantInterests?: string[] // Interesses predominantes (para clusters de usuários)
        averageEngagement?: number // Engajamento médio (para clusters de posts)
    }
}
```

### Tipos de Clusters no Sistema

1. **Clusters de Conteúdo**: Agrupam posts com características similares

    - Por tema/assunto (baseado em tags e descrição)
    - Por padrão de engajamento (likes, comentários, tempo de visualização)
    - Por similaridade visual/estética

2. **Clusters de Usuários**: Agrupam usuários com comportamentos similares

    - Por interesses (baseado nos posts que interagem)
    - Por padrão de atividade (frequência, horários, duração das sessões)
    - Por círculo social (baseado em conexões e interações mútuas)

3. **Clusters Híbridos**: Relacionamentos entre clusters de usuários e de conteúdo
    - Mapeiam quais grupos de usuários interagem com quais grupos de conteúdo
    - Permitem recomendações em múltiplos níveis

## Implementação Detalhada de Clusters de Posts

### 1. Criação e Manutenção de Clusters

```typescript
class PostClusterManager {
    // Criação inicial de clusters usando algoritmo hierárquico
    async createInitialClusters(posts: Post[], config: ClusterConfig): Promise<Cluster[]> {
        // 1. Calcular embeddings para todos os posts
        const embeddings = await Promise.all(
            posts.map((p) => this.embeddingService.getPostEmbedding(p))
        )

        // 2. Aplicar algoritmo de clustering hierárquico
        const initialClusters = this.hierarchicalClustering(embeddings, posts, config)

        // 3. Calcular métricas para cada cluster
        const clustersWithMetrics = this.calculateMetrics(initialClusters)

        // 4. Persistir clusters no banco de dados
        await this.persistClusters(clustersWithMetrics)

        return clustersWithMetrics
    }

    // Atualização incremental dos clusters (executada periodicamente)
    async updateClusters(newPosts: Post[]): Promise<void> {
        // 1. Obter clusters existentes
        const existingClusters = await this.getExistingClusters()

        // 2. Para cada novo post, encontrar o cluster mais próximo
        for (const post of newPosts) {
            const postEmbedding = await this.embeddingService.getPostEmbedding(post)
            const closestCluster = this.findClosestCluster(postEmbedding, existingClusters)

            // 3. Verificar se o post deve ser adicionado ao cluster existente ou criar um novo
            if (this.shouldAddToCluster(postEmbedding, closestCluster)) {
                await this.addPostToCluster(post, closestCluster)
            } else {
                await this.createNewCluster(post)
            }
        }

        // 4. Periodicamente refinar clusters (dividir ou mesclar conforme necessário)
        await this.refineClusters(existingClusters)
    }

    // Método para dividir clusters que ficaram muito grandes ou dispersos
    private async splitCluster(cluster: Cluster): Promise<Cluster[]> {
        if (cluster.size <= 10 || cluster.metrics.cohesion > COHESION_THRESHOLD) {
            return [cluster] // Cluster pequeno ou coeso o suficiente, não dividir
        }

        // Aplicar K-means com k=2 para dividir o cluster
        const memberEmbeddings = await Promise.all(
            cluster.members.map((m) => this.embeddingService.getEntityEmbedding(m.id))
        )

        const [cluster1, cluster2] = this.kMeansClustering(memberEmbeddings, cluster.members, 2)
        return [cluster1, cluster2]
    }

    // Método para mesclar clusters muito próximos
    private async mergeClusters(cluster1: Cluster, cluster2: Cluster): Promise<Cluster> {
        const similarity = this.calculateClusterSimilarity(cluster1, cluster2)

        if (similarity < MERGE_THRESHOLD) {
            return null // Clusters não são similares o suficiente para mesclar
        }

        // Mesclar membros e recalcular centroide
        const mergedMembers = [...cluster1.members, ...cluster2.members]
        const memberEmbeddings = await Promise.all(
            mergedMembers.map((m) => this.embeddingService.getEntityEmbedding(m.id))
        )

        const centroid = this.calculateCentroid(memberEmbeddings)

        return {
            id: uuidv4(),
            centroid,
            radius: this.calculateRadius(memberEmbeddings, centroid),
            members: mergedMembers,
            size: mergedMembers.length,
            createdAt: new Date(),
            updatedAt: new Date(),
            metrics: this.calculateClusterMetrics(memberEmbeddings, centroid),
            metadata: this.extractClusterMetadata(mergedMembers),
        }
    }
}
```

### 2. Características dos Clusters de Posts

Os clusters de posts são configurados com os seguintes parâmetros:

-   **Tamanho ótimo**: Entre 50-1000 posts por cluster (configurável)
-   **Dimensões de similaridade**:
    -   Similaridade temática (80% do peso)
    -   Similaridade de engajamento (15% do peso)
    -   Similaridade temporal (5% do peso)
-   **Atualização**:
    -   Batch diário para recalcular centroides
    -   Atualizações em tempo real para adição de novos posts
    -   Reclustering completo semanal para otimização

### 3. Metadata dos Clusters de Posts

Cada cluster de posts mantém metadados que ajudam a entender seu conteúdo e comportamento:

```typescript
interface PostClusterMetadata {
    dominantTags: Array<{ tag: string; weight: number }>
    topCreators: Array<{ userId: bigint; postCount: number }>
    engagementStats: {
        averageViews: number
        averageLikes: number
        averageComments: number
        averageWatchTime: number
    }
    temporalPattern: {
        creationTimeDistribution: Record<string, number> // Hora do dia -> frequência
        peakEngagementTimes: Record<string, number> // Hora do dia -> nível de engajamento
    }
    growthRate: number // Taxa de crescimento do cluster nas últimas 2 semanas
}
```

## Ranqueamento de Usuários Dentro dos Clusters

O ranqueamento de usuários dentro de um cluster é fundamental para determinar:

1. A afinidade de um usuário com um cluster específico
2. A influência relativa do usuário dentro do cluster
3. A probabilidade de engajamento com novos conteúdos do cluster

### 1. Modelo de Ranqueamento

```typescript
interface UserClusterRank {
    userId: bigint
    clusterId: string
    scores: {
        affinity: number // 0-1: Quanto o usuário se alinha com o cluster
        influence: number // 0-1: Impacto do usuário no cluster (criação e engajamento)
        engagementProbability: number // 0-1: Probabilidade de engajamento com novos itens
        timeDecayFactor: number // 0-1: Recência das interações (mais recente = maior valor)
    }
    interactionStats: {
        viewCount: number
        likeCount: number
        commentCount: number
        shareCount: number
        avgWatchTimePercentage: number
    }
    lastInteractionDate: Date
    overallRank: number // Score composto final (0-100)
}
```

### 2. Algoritmo de Ranqueamento Dentro do Cluster

```typescript
class UserClusterRanker {
    async rankUsersInCluster(clusterId: string): Promise<UserClusterRank[]> {
        // 1. Obter o cluster e suas características
        const cluster = await this.clusterService.getClusterById(clusterId)

        // 2. Obter usuários que interagiram com posts do cluster
        const userInteractions = await this.interactionService.getUserInteractionsWithCluster(
            clusterId
        )

        // 3. Agrupar interações por usuário
        const userGroupedInteractions = this.groupInteractionsByUser(userInteractions)

        // 4. Calcular ranks individuais para cada usuário
        const userRanks = await Promise.all(
            Object.entries(userGroupedInteractions).map(async ([userId, interactions]) => {
                // Calcular scores específicos
                const affinity = this.calculateUserClusterAffinity(userId, cluster)
                const influence = this.calculateUserInfluence(interactions, cluster)
                const engagementProb = this.predictEngagementProbability(userId, cluster)
                const timeDecay = this.calculateTimeDecayFactor(interactions)

                // Estatísticas de interação
                const stats = this.computeInteractionStats(interactions)

                // Calcular rank composto
                const overallRank = this.computeOverallRank({
                    affinity,
                    influence,
                    engagementProb,
                    timeDecay,
                })

                return {
                    userId: BigInt(userId),
                    clusterId,
                    scores: {
                        affinity,
                        influence,
                        engagementProbability: engagementProb,
                        timeDecayFactor: timeDecay,
                    },
                    interactionStats: stats,
                    lastInteractionDate: this.getLastInteractionDate(interactions),
                    overallRank,
                }
            })
        )

        // 5. Ordenar usuários por rank geral
        return userRanks.sort((a, b) => b.overallRank - a.overallRank)
    }

    // Calcula a afinidade do usuário com o cluster com base em seu embedding
    private async calculateUserClusterAffinity(userId: string, cluster: Cluster): Promise<number> {
        const userEmbedding = await this.userEmbeddingService.getUserEmbedding(userId)
        return cosineSimilarity(userEmbedding, cluster.centroid)
    }

    // Calcula a influência do usuário no cluster
    private calculateUserInfluence(interactions: Interaction[], cluster: Cluster): number {
        // Contabiliza post criados pelo usuário no cluster
        const userCreatedPosts = cluster.members.filter(
            (m) => m.type === "POST" && m.creatorId === interactions[0].userId
        ).length

        // Proporção de posts do cluster com que o usuário interagiu
        const interactionCoverage = interactions.length / cluster.size

        // Qualidade das interações (engajamento profundo vale mais)
        const interactionQuality = this.calculateInteractionQuality(interactions)

        return userCreatedPosts * 0.5 + interactionCoverage * 0.3 + interactionQuality * 0.2
    }

    // Calcula o rank geral composto de todos os fatores
    private computeOverallRank(scores: any): number {
        return (
            (scores.affinity * WEIGHTS.AFFINITY +
                scores.influence * WEIGHTS.INFLUENCE +
                scores.engagementProb * WEIGHTS.ENGAGEMENT_PROB +
                scores.timeDecay * WEIGHTS.TIME_DECAY) *
            100
        )
    }
}
```

### 3. Fatores no Ranqueamento de Usuários

O ranqueamento dos usuários dentro de um cluster considera os seguintes fatores:

1. **Afinidade com o Centroide (30%)**

    - Similaridade entre o embedding do usuário e o centroide do cluster
    - Indica o quanto os interesses do usuário se alinham com o tema do cluster

2. **Padrão de Engajamento (25%)**

    - Frequência e profundidade de interações com posts do cluster
    - Tipos de interações (visualizações < likes < comentários < compartilhamentos)

3. **Taxa de Conversão (20%)**

    - Proporção entre visualizações e ações positivas tomadas
    - Maior taxa indica maior relevância do cluster para o usuário

4. **Recência (15%)**

    - Quão recentes são as interações do usuário com o cluster
    - Aplicação de uma função de decaimento temporal exponencial

5. **Consistência (10%)**
    - Padrão consistente de interações ao longo do tempo
    - Usuários com interações consistentes são mais previsíveis

### 4. Aplicações Práticas do Ranqueamento

O ranqueamento de usuários dentro dos clusters é utilizado para:

1. **Personalização de Feed**

    - Priorizar conteúdo de clusters onde o usuário tem alto rank
    - Introduzir conteúdo de clusters relacionados onde usuários similares têm alto rank

2. **Descoberta de Conteúdo**

    - Identificar usuários influentes em cada cluster para expandir alcance
    - Usar preferências de usuários altamente ranqueados como proxy para novos usuários similares

3. **Análise de Tendências**

    - Monitorar mudanças nos rankings para detectar tendências emergentes
    - Identificar clusters com rápido crescimento de interações de usuários de alta influência

4. **Controle de Qualidade**
    - Usar feedback de usuários com alto ranking como indicadores de qualidade do cluster
    - Detectar anomalias quando usuários de alto ranking subitamente diminuem engajamento

## Arquitetura Proposta

```
swipe-engine/
├── src/
│   ├── core/                       # Núcleo do sistema
│   │   ├── embeddings/             # Geração e manipulação de embeddings
│   │   ├── clustering/             # Algoritmos de clustering
│   │   └── similarity/             # Cálculos de similaridade
│   ├── modules/
│   │   ├── users/                  # Módulos relacionados a usuários
│   │   │   ├── user-embedding/     # Embeddings de usuários
│   │   │   ├── user-clusters/      # Agrupamentos de usuários
│   │   │   └── preferences/        # Preferências e comportamentos
│   │   ├── posts/                  # Módulos relacionados a posts
│   │   │   ├── post-embedding/     # Embeddings de posts
│   │   │   ├── post-clusters/      # Agrupamentos de posts
│   │   │   └── engagement/         # Métricas de engajamento
│   │   └── feed/                   # Geração de feed personalizado
│   │       ├── ranking/            # Algoritmos de ranking
│   │       ├── diversity/          # Garantia de diversidade no feed
│   │       └── freshness/          # Priorização de conteúdo recente
│   ├── services/
│   │   ├── batch-processing/       # Processamento em lote de embeddings
│   │   ├── real-time/              # Serviços em tempo real
│   │   └── analytics/              # Análise de desempenho e padrões
│   └── api/                        # Endpoints da API
├── scripts/                        # Scripts de treinamento e manutenção
└── tests/                          # Testes unitários e de integração
```

## Fluxo de Funcionamento

### 1. Geração de Embeddings

#### Para Usuários:

```typescript
interface UserEmbeddingProps {
    interactionHistory: UserInteraction[]
    viewingPatterns: ViewMetrics[]
    contentPreferences: string[]
    demographicInfo?: UserDemographics
}

// Resultado: vetor de embedding de alta dimensão representando o perfil do usuário
```

#### Para Posts:

```typescript
interface PostEmbeddingProps {
    textContent: string
    tags: string[]
    engagementMetrics: {
        views: number
        likes: number
        shares: number
        comments: number
        watchTime: number
        // outras métricas...
    }
    authorId: bigint
    createdAt: Date
}

// Resultado: vetor de embedding representando o conteúdo e características do post
```

### 2. Formação de Clusters

O sistema forma clusters dinamicamente usando:

-   **Algoritmo Hierárquico**: Para formar a estrutura inicial de clusters
-   **K-means Adaptativo**: Para refinar clusters em tempo real
-   **Aprendizado Contínuo**: Adaptação a novos padrões e tendências

```typescript
interface ClusterProps {
    centroid: number[]
    members: (User | Post)[]
    cohesion: number // métrica de coesão interna
    lastUpdated: Date
}
```

### 3. Geração de Feed

```typescript
async function generatePersonalizedFeed(userId: bigint): Promise<Post[]> {
    // 1. Identificar clusters do usuário
    const userClusters = await getUserClusters(userId)

    // 2. Encontrar posts relevantes de clusters similares
    const candidatePosts = await getCandidatePosts(userClusters)

    // 3. Aplicar ranking personalizado
    const rankedPosts = rankPosts(candidatePosts, userId)

    // 4. Garantir diversidade e novidade
    const diverseFeed = ensureDiversity(rankedPosts)

    return diverseFeed
}
```

## Componentes-Chave

### 1. Motor de Embeddings

-   **Técnicas Implementadas**:
    -   Word2Vec para tags e texto
    -   Embeddings de engajamento normalizados
    -   Embeddings temporais para capturar tendências
-   **Atualização**:
    -   Em lote (diário) para tendências gerais
    -   Em tempo real para comportamentos recentes

### 2. Sistema de Clusters

-   **Estrutura Hierárquica**:
    -   Clusters gerais (temas amplos)
    -   Sub-clusters (nichos específicos)
-   **Métricas**:
    -   Coesão interna
    -   Separação entre clusters
    -   Taxa de crescimento

### 3. Algoritmo de Ranking

```typescript
function rankPost(post: Post, userProfile: UserProfile): number {
    let score = 0

    // Relevância baseada em similaridade de embedding
    score += calculateCosineSimilarity(userProfile.embedding, post.embedding) * WEIGHTS.SIMILARITY

    // Frescor do conteúdo
    score += calculateFreshnessScore(post.createdAt) * WEIGHTS.FRESHNESS

    // Engajamento prévio de usuários semelhantes
    score += calculateClusterEngagement(post.id, userProfile.clusters) * WEIGHTS.CLUSTER_ENGAGEMENT

    // Diversidade para evitar conteúdo repetitivo
    score += calculateDiversityBonus(post, userProfile.recentlyViewed) * WEIGHTS.DIVERSITY

    return score
}
```

## Vantagens da Nova Arquitetura

### Técnicas

-   **Precisão**: Melhoria estimada de 30-40% na relevância das recomendações
-   **Performance**: Redução de 60% no tempo de geração de feed
-   **Escalabilidade**: Suporte para milhões de usuários com atualização em tempo real

### Para Usuários

-   **Descoberta**: Melhor descoberta de conteúdo relevante
-   **Engajamento**: Aumento previsto de 25% no tempo médio de sessão
-   **Satisfação**: Redução da taxa de abandono

## Implementação Técnica

### Tecnologias Recomendadas

-   **Processamento de Embeddings**: TensorFlow.js ou ONNX Runtime
-   **Armazenamento de Vetores**: FAISS ou Pinecone
-   **Processamento em Lote**: Apache Spark ou AWS EMR
-   **Serviços em Tempo Real**: Node.js com Redis

### Estratégia de Migração

1. **Fase 1**: Implementação paralela sem impacto no sistema atual
2. **Fase 2**: Testes A/B com 10% dos usuários
3. **Fase 3**: Rolagem gradual para 100% dos usuários

## Métricas de Sucesso

-   **Engajamento**:
    -   Aumento no tempo médio de sessão
    -   Crescimento das interações por sessão
-   **Qualidade**:
    -   Taxa de cliques (CTR)
    -   Tempo médio de visualização
-   **Negócio**:
    -   Retenção de usuários
    -   Crescimento de MAU/DAU

## Próximos Passos

1. **Curto Prazo**:

    - Implementar sistema de embeddings para posts
    - Desenvolver algoritmo de clustering inicial

2. **Médio Prazo**:

    - Integrar feedback de usuários para melhorar os clusters
    - Implementar mecanismos de diversidade

3. **Longo Prazo**:
    - Sistema de explicabilidade das recomendações
    - Personalização avançada com aprendizado por reforço

---

## Exemplos de Código

### Cálculo de Similaridade entre Embeddings

```typescript
function cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < embeddingA.length; i++) {
        dotProduct += embeddingA[i] * embeddingB[i]
        normA += embeddingA[i] * embeddingA[i]
        normB += embeddingB[i] * embeddingB[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
```

### Atualização de Embedding de Usuário

```typescript
async function updateUserEmbedding(
    userId: bigint,
    interactionType: string,
    postEmbedding: number[]
): Promise<number[]> {
    // Obter embedding atual do usuário
    const currentEmbedding = await getUserEmbedding(userId)

    // Obter peso baseado no tipo de interação
    const weight = getInteractionWeight(interactionType)

    // Atualizar embedding com base na interação
    const updatedEmbedding = currentEmbedding.map(
        (val, i) => val * (1 - weight) + postEmbedding[i] * weight
    )

    // Normalizar embedding
    const norm = Math.sqrt(updatedEmbedding.reduce((acc, val) => acc + val * val, 0))
    const normalizedEmbedding = updatedEmbedding.map((val) => val / norm)

    // Salvar embedding atualizado
    await saveUserEmbedding(userId, normalizedEmbedding)

    return normalizedEmbedding
}
```

Este README fornece um modelo arquitetural robusto que pode ser implementado em fases, permitindo melhorias incrementais no sistema de recomendação do Circle App.
