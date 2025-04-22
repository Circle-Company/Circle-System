# 🔄 SwipeEngine v2

O SwipeEngine v2 é um motor de recomendação avançado baseado em SimClusters, projetado para fornecer recomendações personalizadas de conteúdo e usuários na plataforma Circle.

## Visão Geral

O SwipeEngine utiliza técnicas de embedding, clustering e ranking para criar um sistema de recomendação eficiente e personalizável. Ele é capaz de:

-   Gerar recomendações personalizadas com base nas interações do usuário
-   Agrupar conteúdo e usuários em clusters de interesse
-   Balancear relevância, diversidade e novidade nas recomendações
-   Aprender e adaptar-se ao comportamento do usuário ao longo do tempo

## Arquitetura

O SwipeEngine v2 é organizado em componentes modulares:

```
src/swipe-engine/v2/
│
├── core/                      # Componentes principais
│   ├── embeddings/            # Serviços de geração de embeddings
│   ├── clustering/            # Algoritmos de clustering
│   ├── recommendation/        # Motor de recomendação
│   ├── feedback/              # Processamento de feedback do usuário
│   ├── monitoring/            # Monitoramento e métricas
│   ├── utils/                 # Utilitários comuns
│   └── types.ts               # Definições de tipos
│
└── index.ts                   # Ponto de entrada principal
```

## Componentes Principais

### 1. Embeddings

Serviços responsáveis por gerar e atualizar representações vetoriais (embeddings) de usuários e conteúdos:

-   `BaseEmbeddingService`: Classe abstrata base para todos os serviços de embedding
-   `UserEmbeddingService`: Gera embeddings para usuários com base em seu histórico de interações
-   `PostEmbeddingService`: Gera embeddings para posts com base em seu conteúdo e engajamento

### 2. Clustering

Algoritmos para agrupar embeddings similares em clusters:

-   `ClusteringAlgorithm`: Interface para algoritmos de clustering
-   `ClusteringFactory`: Fábrica para instanciar diferentes algoritmos de clustering
-   `HierarchicalClustering`: Implementação de clustering hierárquico aglomerativo
-   `KMeansClustering`: Implementação do algoritmo K-means
-   `DBSCANClustering`: Implementação do algoritmo DBSCAN

### 3. Recommendation

Motor principal de recomendação que coordena os outros componentes:

-   `RecommendationEngine`: Classe principal que gerencia o fluxo de recomendação
-   `ClusterMatcher`: Encontra clusters relevantes para um usuário
-   `CandidateSelector`: Seleciona candidatos a recomendação dos clusters
-   `RankingService`: Ordena candidatos por relevância

### 4. Feedback

Processamento de feedback do usuário para melhorar recomendações futuras:

-   `FeedbackProcessor`: Processa diferentes tipos de sinais de feedback
-   `UserInterestTracker`: Monitora e modela os interesses do usuário ao longo do tempo

### 5. Monitoring

Monitoramento do desempenho do sistema de recomendação:

-   `RecommendationMonitor`: Avalia a qualidade das recomendações
-   `MetricsCollector`: Coleta métricas sobre o sistema

## Como Usar

Para utilizar o SwipeEngine v2:

```typescript
import { createSwipeEngine } from "src/swipe-engine/v2"

// Criar instância do motor de recomendação
const swipeEngine = createSwipeEngine({
    embeddingDimension: 128,
    modelPath: "models/user_embedding_model",
    // Repositórios necessários
    userRepository: userRepo,
    interactionRepository: interactionRepo,
    userEmbeddingRepository: userEmbeddingRepo,
})

// Obter recomendações para um usuário
const recommendations = await swipeEngine.getRecommendations(
    userId,
    10, // número de recomendações
    {
        diversityLevel: 0.3,
        strategy: "personalized",
    }
)
```

## Extensibilidade

O SwipeEngine v2 foi projetado para ser extensível:

1. **Novos Algoritmos de Clustering**: Implemente a interface `ClusteringAlgorithm` e registre no `ClusteringFactory`
2. **Novos Tipos de Embeddings**: Estenda a classe `BaseEmbeddingService`
3. **Estratégias de Ranking**: Adicione novas estratégias ao `RankingService`
4. **Novos Filtros**: Implemente filtros adicionais no pipeline de recomendação

## Roadmap

-   [ ] Implementação completa dos algoritmos de clustering
-   [ ] Serviço de embedding para posts
-   [ ] Persistência de embeddings e clusters
-   [ ] API de feedback para aprendizado contínuo
-   [ ] Dashboards de monitoramento
-   [ ] Testes A/B para otimização das recomendações
