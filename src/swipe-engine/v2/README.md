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
-   `DBSCANClustering`: Implementação do algoritmo DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
-   `performClustering`: Função auxiliar para executar clustering facilmente
-   `trainClusteringModel`: Função para treinar o modelo com dados existentes

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

## Testando o ClusterMatcher

O módulo `ClusterMatcher` é um componente fundamental do sistema de recomendação, responsável por encontrar clusters relevantes para um usuário com base em seu embedding, perfil e contexto.

### Executando os Testes

Os testes do ClusterMatcher utilizam Vitest e podem ser executados com o seguinte comando:

```bash
npm test -- src/swipe-engine/v2/core/recommendation/__tests__/ClusterMatcher.test.ts
```

ou com watch mode para desenvolvimento:

```bash
npm test -- --watch src/swipe-engine/v2/core/recommendation/__tests__/ClusterMatcher.test.ts
```

### Exemplo de Demonstração

Um exemplo de demonstração foi criado para ilustrar o uso do ClusterMatcher em diferentes cenários:

```bash
# Compilar o TypeScript
npm run build

# Executar o exemplo
node build/swipe-engine/v2/examples/cluster-matcher-demo.js
```

Alternativamente, use ts-node para executar o exemplo diretamente:

```bash
npx ts-node src/swipe-engine/v2/examples/cluster-matcher-demo.ts
```

### Características do ClusterMatcher

O ClusterMatcher implementa várias estratégias de recomendação:

1. **Recomendação baseada em embeddings** - Utiliza similaridade de cosseno entre embeddings
2. **Recomendação baseada em perfil** - Quando embeddings não estão disponíveis
3. **Recomendação padrão diversificada** - Utilizando a propriedade `size` dos clusters

A estratégia de diversificação implementada distribui as recomendações entre:

-   60% clusters grandes (populares)
-   30% clusters médios
-   10% clusters pequenos (de nicho)

Isso assegura que mesmo os usuários novos ou sem perfil recebam recomendações variadas.

## Ferramenta de Teste SimCluster

Para facilitar os testes do sistema, foi criada uma ferramenta completa chamada `SimCluster Test Runner`. Ela permite:

-   Gerar embeddings simulados de usuários e posts
-   Construir SimClusters usando DBSCAN
-   Salvar os resultados em arquivos JSON para reuso
-   Testar o algoritmo de recomendação com dados realistas

Para executar a ferramenta de teste:

```bash
npm run test:simclusters
```

Mais detalhes podem ser encontrados em [`/examples/README.md`](/src/swipe-engine/v2/examples/README.md).
