# SwipeEngine V2

O SwipeEngine é um sistema de recomendação baseado em embeddings e clustering, projetado para oferecer recomendações personalizadas de conteúdo e conexões entre usuários.

## Arquitetura

O SwipeEngine V2 foi construído de forma modular, com os seguintes componentes principais:

### Core

1. **Serviços de Embedding**

    - `BaseEmbeddingService`: Classe abstrata base para serviços de embedding
    - `UserEmbeddingService`: Gera e atualiza embeddings de usuários
    - `PostEmbeddingService`: Gera e atualiza embeddings de conteúdo

2. **Clustering**

    - `ClusteringAlgorithm`: Interface para algoritmos de clustering
    - `BaseClusteringAlgorithm`: Classe abstrata com funcionalidades comuns para algoritmos de clustering
    - `SimpleKMeans`: Implementação do algoritmo K-Means
    - `ClusteringFactory`: Fábrica para criar instâncias de algoritmos de clustering

3. **Recomendação**

    - `RecommendationEngine`: Motor principal de recomendação
    - `ClusterMatcher`: Corresponde usuários a clusters com base em similaridade

4. **Utilitários**
    - `vectorUtils`: Operações com vetores (distância, similaridade, etc.)
    - `normalization`: Funções para normalização de embeddings
    - `logger`: Sistema de logging consistente

## Como Usar

### Inicialização Básica

```typescript
import { createSwipeEngine } from "./swipe-engine/v2"

// Criar uma instância com configuração padrão
const swipeEngine = createSwipeEngine()

// Obter recomendações para um usuário
const userId = BigInt(123456)
const recommendations = await swipeEngine.getRecommendations(userId)
```

### Configuração Personalizada

```typescript
import { createSwipeEngine, SimpleKMeans } from "./swipe-engine/v2"

// Criar instância com configurações personalizadas
const swipeEngine = createSwipeEngine({
    embeddingDimension: 256,
    modelPath: "models/custom_embedding_model",

    // Repositórios personalizados
    userRepository: myUserRepository,
    interactionRepository: myInteractionRepository,
    userEmbeddingRepository: myEmbeddingRepository,

    // Algoritmos de clustering personalizados
    customClusteringAlgorithms: {
        "my-custom-algorithm": () => new MyCustomAlgorithm(),
    },

    // Opções de recomendação
    recommendationOptions: {
        defaultClusteringAlgorithm: "kmeans",
        cacheExpiration: 30 * 60 * 1000, // 30 minutos
        diversityLevel: 0.7,
    },
})
```

## Fluxo de Recomendação

1. O sistema gera embeddings para usuários com base em suas interações e perfil
2. Os embeddings são agrupados em clusters usando algoritmos como K-Means
3. Quando um usuário solicita recomendações:
    - O sistema encontra clusters relevantes para o usuário
    - Extrai candidatos desses clusters
    - Filtra e ranqueia os candidatos
    - Diversifica os resultados
    - Retorna as recomendações finais

## Extensão

### Criando um Novo Algoritmo de Clustering

```typescript
import { BaseClusteringAlgorithm, Cluster, ClusterConfig, Entity } from "./swipe-engine/v2"

export class MyCustomAlgorithm extends BaseClusteringAlgorithm {
    public readonly name = "my-custom-algorithm"

    public async cluster(
        embeddings: number[][],
        entities: Entity[],
        config: ClusterConfig
    ): Promise<Cluster[]> {
        // Validar entrada
        this.validateInput(embeddings, entities)

        // Implementação personalizada...

        // Retornar clusters formados
        return clusters
    }
}
```

### Registrando o Algoritmo

```typescript
import { ClusteringFactory } from "./swipe-engine/v2"
import { MyCustomAlgorithm } from "./my-custom-algorithm"

const factory = new ClusteringFactory()
factory.registerAlgorithm("custom", () => new MyCustomAlgorithm())
```

## Métricas e Monitoramento

O SwipeEngine inclui recursos para monitorar a qualidade das recomendações:

-   Coesão de clusters: O quão próximos estão os membros de um cluster
-   Diversidade: Variedade de recomendações
-   Feedback dos usuários: Captura de interações para melhorar as recomendações futuras

## Roadmap

Funcionalidades planejadas para futuras versões:

1. Suporte para embeddings mais avançados (BERT, transformers)
2. Algoritmos adicionais de clustering (DBSCAN, Hierarchical)
3. Recomendações contextuais (por localização, hora do dia)
4. Suporte para feedback explícito dos usuários
5. Explicabilidade de recomendações
