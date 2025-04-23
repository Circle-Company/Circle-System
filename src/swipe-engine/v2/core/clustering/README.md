# Módulo de Clustering

Este módulo contém a implementação do algoritmo DBSCAN (Density-Based Spatial Clustering of Applications with Noise) utilizado pelo SwipeEngine para agrupar entidades similares em clusters.

## Componentes Principais

### DBSCANClustering

Implementação do algoritmo DBSCAN para clustering baseado em densidade. Este algoritmo tem as seguintes vantagens:

-   **Não requer número predefinido de clusters**: Descobre automaticamente o número adequado de clusters
-   **Identifica outliers**: Pontos isolados são identificados como ruído
-   **Encontra clusters de formato arbitrário**: Não assume clusters esféricos como o K-Means
-   **Robustez**: Menos sensível a outliers e ruídos nos dados

## Como Usar

### Importação

```typescript
import { DBSCANClustering, DBSCANConfig, performClustering } from "../clustering"

// Criar uma instância
const dbscan = new DBSCANClustering()

// Ou usar a função utilitária
const result = await performClustering(embeddings, entities, config)
```

### Clusterização de Embeddings

```typescript
// Dados para clustering
const embeddings = [
    [0.1, 0.2, 0.3, 0.4], // Embedding 1
    [0.2, 0.3, 0.4, 0.5], // Embedding 2
    // ...
]

const entities = [
    { id: "user1", type: "user" },
    { id: "user2", type: "user" },
    // ...
]

// Configuração específica para o DBSCAN
const config: DBSCANConfig = {
    epsilon: 0.3, // Raio da vizinhança
    minPoints: 5, // Pontos mínimos para formar um cluster
    distanceFunction: "cosine", // Função de distância
}

// Executar clustering
const result = await dbscan.cluster(embeddings, entities, config)

// Resultado contém clusters e atribuições
console.log(`Encontrados ${result.clusters.length} clusters`)
```

### Treinamento com Dados Existentes

```typescript
// Dados de treinamento
const trainingData = {
    ids: ["user1", "user2", "user3", "user4"],
    vectors: [
        [0.1, 0.2, 0.3],
        [0.2, 0.3, 0.4],
        [0.9, 0.8, 0.7],
        [0.8, 0.7, 0.6],
    ],
}

// Treinar o modelo
const result = await dbscan.train(trainingData, config)
```

## Configuração

O algoritmo DBSCAN aceita várias opções de configuração:

| Parâmetro        | Descrição                                                                     | Valor Padrão       |
| ---------------- | ----------------------------------------------------------------------------- | ------------------ |
| epsilon          | Raio da vizinhança (distância máxima para pontos serem considerados vizinhos) | 0.3                |
| minPoints        | Número mínimo de pontos para formar um cluster                                | 5                  |
| distanceFunction | Função de distância ("euclidean", "cosine", "manhattan")                      | "cosine"           |
| noiseHandling    | Como tratar pontos de ruído ("separate-cluster", "ignore")                    | "separate-cluster" |

## Métricas

O resultado do clustering inclui várias métricas úteis:

-   **Coesão**: Quão próximos estão os pontos dentro de cada cluster
-   **Densidade**: Concentração de pontos dentro de cada cluster
-   **Qualidade**: Pontuação geral da qualidade do clustering (0-1)

## Extensão

A classe `DBSCANClustering` pode ser estendida para implementar variantes do algoritmo ou otimizações específicas para casos de uso particulares.
