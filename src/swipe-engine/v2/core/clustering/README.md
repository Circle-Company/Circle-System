# Clustering no Swipe Engine

Este módulo implementa o algoritmo de clustering K-means para o Swipe Engine, usado para agrupar entidades (usuários ou posts) com base em seus embeddings.

## Algoritmo Implementado

### KMeansClustering

A implementação do algoritmo K-means é eficiente e otimizada para trabalhar com embeddings de alta dimensionalidade. O algoritmo agrupa entidades em clusters onde cada entidade pertence ao cluster cujo centroide é o mais próximo.

**Características:**

-   Inicialização de centroides com método aleatório ou k-means++
-   Métrica de distância configurável (euclidiana, cosseno ou manhattan)
-   Detecção automática de convergência
-   Cálculo de métricas de qualidade para clusters

## Como Utilizar

```typescript
import { KMeansClustering } from "../clustering";

// Criar instância do algoritmo
const kmeans = new KMeansClustering();

// Embeddings e entidades para clustering
const embeddings: number[][] = [...]; // Matriz de vetores de embedding
const entities = [...]; // Array de entidades (usuários ou posts)

// Configuração do clustering
const config = {
  numClusters: 10,
  maxIterations: 100,
  distanceFunction: "euclidean"
};

// Realizar clustering
const clusters = await kmeans.cluster(embeddings, entities, config);

// Acessar os resultados
for (const cluster of clusters) {
  console.log(`Cluster ${cluster.id} contém ${cluster.size} membros`);
  console.log(`Centroide: ${cluster.centroid}`);
  console.log(`Métricas: Coesão ${cluster.metrics.cohesion}`);
}
```

## API

### `cluster(embeddings, entities, config)`

Realiza o clustering dos embeddings e retorna um array de clusters.

**Parâmetros:**

-   `embeddings: number[][]`: Matriz de embeddings, onde cada linha é um vetor
-   `entities: Entity[]`: Array de entidades correspondentes aos embeddings
-   `config: ClusterConfig`: Configuração do algoritmo

**Retorno:**

-   `Promise<Cluster[]>`: Array de clusters formados

### `train(data, config)`

Treina o algoritmo com dados fornecidos e retorna informações detalhadas sobre o processo de clustering.

**Parâmetros:**

-   `data: ClusteringTrainingData`: Dados de treinamento
-   `config?: Partial<ClusteringConfig>`: Configuração opcional

**Retorno:**

-   `Promise<ClusteringResult>`: Resultado detalhado do clustering

## Configuração

O algoritmo KMeans aceita várias opções de configuração:

```typescript
interface ClusterConfig {
    numClusters?: number // Número de clusters (padrão: 10)
    maxIterations?: number // Máximo de iterações (padrão: 100)
    distanceFunction?: "cosine" | "euclidean" | "manhattan" // (padrão: "euclidean")
}
```

## Implementação

A implementação segue estas etapas:

1. **Inicialização**: Centroides iniciais são escolhidos (aleatoriamente ou via k-means++)
2. **Atribuição**: Cada entidade é associada ao centroide mais próximo
3. **Atualização**: Centroides são recalculados como a média dos pontos em cada cluster
4. **Convergência**: Repete os passos 2-3 até convergir ou atingir o número máximo de iterações
5. **Formação de Clusters**: Os clusters finais são formados e suas métricas calculadas
