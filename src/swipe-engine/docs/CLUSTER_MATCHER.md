# ClusterMatcher

O `ClusterMatcher` é um componente fundamental do motor de recomendação do SwipeEngine V2. Ele é responsável por encontrar clusters relevantes para um usuário com base em seu embedding vetorial, perfil de usuário e contexto atual.

## Funcionalidades

-   **Recomendação baseada em embeddings**: Encontra clusters semelhantes usando similaridade de cosseno
-   **Recomendação baseada em perfil**: Quando embeddings não estão disponíveis, usa interesses e demografia
-   **Recomendação contextual**: Considera fatores como hora do dia, localização e idioma
-   **Recomendação padrão**: Fornece clusters populares para novos usuários sem dados suficientes
-   **Estratégias de diversificação**: Equilibra clusters grandes, médios e pequenos
-   **Estatísticas de cluster**: Fornece métricas detalhadas sobre os clusters disponíveis

## Uso Básico

```typescript
import { createClusterMatcher } from "../core/recommendation"

// Criar uma instância com configuração básica
const clusterMatcher = createClusterMatcher(clusters, {
    minMatchThreshold: 0.2, // Limiar mínimo de similaridade
    maxClusters: 5, // Número máximo de clusters retornados
})

// Obter clusters relevantes para um usuário
const relevantClusters = clusterMatcher.findRelevantClusters(
    userEmbedding, // Embedding do usuário (pode ser null)
    userProfile, // Perfil do usuário (opcional)
    context // Contexto da recomendação (opcional)
)
```

## Pesos e Configuração

O `ClusterMatcher` usa uma combinação ponderada de fatores para determinar a relevância:

-   `embeddingWeight` (default: 0.5): Peso da similaridade do embedding do usuário
-   `interestWeight` (default: 0.3): Peso dos interesses compartilhados
-   `contextWeight` (default: 0.2): Peso dos fatores contextuais

Os pesos são normalizados automaticamente para somar 1.0.

## Estratégia para Clusters Padrão

Quando não há informações suficientes sobre o usuário, o `ClusterMatcher` utiliza a propriedade `size` dos clusters para selecionar uma mistura diversificada:

1. Classifica clusters em pequenos, médios e grandes com base no tamanho médio
2. Seleciona clusters de cada categoria, com uma distribuição de:
    - 60% de clusters grandes (populares)
    - 30% de clusters médios
    - 10% de clusters pequenos (nichos)
3. Prioriza clusters com maior densidade dentro de cada categoria

## Exemplos Avançados

### Criação Personalizada

```typescript
const clusterMatcher = new ClusterMatcher(clusters, {
    minMatchThreshold: 0.15,
    contextWeight: 0.3,
    interestWeight: 0.2,
    embeddingWeight: 0.5,
    maxClusters: 10,
})
```

### Obtenção de Estatísticas

```typescript
// Obter estatísticas detalhadas sobre clusters
const stats = clusterMatcher.getClusterStats()

console.log(`Total de clusters: ${stats.count}`)
console.log(`Membros totais: ${stats.totalMembers}`)
console.log(`Tamanho médio: ${stats.sizeStats.avgSize}`)
console.log(`Distribuição: ${JSON.stringify(stats.sizeDistribution)}`)
```

### Atualização de Clusters

```typescript
// Atualizar clusters após recalculação
clusterMatcher.updateClusters(newClusters)
```

## Fórmula de Relevância

A similaridade final entre um usuário e um cluster é calculada como:

```
similaridade_final = (embeddingWeight * similaridade_cosseno) +
                      (contextWeight * boost_contextual) +
                      (interestWeight * similaridade_interesses)
```

## Fatores Contextuais Considerados

-   **Hora do dia**: Clusters ativos durante o horário atual
-   **Localização**: Clusters populares na localização do usuário
-   **Idioma**: Clusters que compartilham o idioma do usuário
-   **Interesses**: Tópicos compartilhados entre o usuário e o cluster

## Integração com o Motor de Recomendação

O `ClusterMatcher` é usado pelo `RecommendationEngine` para a primeira etapa do pipeline de recomendação:

1. `ClusterMatcher` encontra clusters relevantes
2. `CandidateSelector` extrai candidatos desses clusters
3. `RankingService` ordena os candidatos por relevância
4. Diversificação e filtragem produzem as recomendações finais
