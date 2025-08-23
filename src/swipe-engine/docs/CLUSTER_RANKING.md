# ClusterRankingAlgorithm

## Visão Geral

O `ClusterRankingAlgorithm` é um sistema avançado de ranqueamento de clusters que incorpora múltiplas métricas e fatores para determinar a relevância dos clusters para recomendação. Este algoritmo implementa um modelo multi-fatorial que permite uma abordagem holística para determinar quais clusters são mais relevantes para cada usuário.

## Arquitetura

### Componentes Principais

```
ClusterRankingAlgorithm
├── Métricas de Afinidade (AffinityMetrics)
├── Métricas de Engajamento (EngagementMetrics)
├── Métricas de Novidade (NoveltyMetrics)
├── Métricas de Diversidade (DiversityMetrics)
├── Métricas Temporais (TemporalMetrics)
└── Métricas de Qualidade (QualityMetrics)
```

### Fluxo de Processamento

1. **Entrada**: Lista de clusters, embedding do usuário, perfil do usuário, contexto
2. **Cálculo Multi-Fatorial**: Cada cluster é avaliado por 6 métricas diferentes
3. **Ajuste Contextual**: Pesos são ajustados baseado no perfil e contexto
4. **Combinação Ponderada**: Scores são combinados usando pesos configuráveis
5. **Cálculo de Confiança**: Nível de confiança é calculado baseado na variância
6. **Saída**: Lista de clusters ranqueados com scores e metadados

## Métricas Implementadas

### 1. Afinidade (AffinityMetrics)
**Objetivo**: Avaliar similaridade semântica entre usuário e cluster

- **Similaridade de Embedding**: Cálculo de similaridade coseno entre vetores
- **Alinhamento de Interesses**: Comparação de tópicos e interesses
- **Proximidade na Rede**: Análise de conexões e comunidades

**Peso Padrão**: 0.4 (configurável)

### 2. Engajamento (EngagementMetrics)
**Objetivo**: Avaliar histórico de interações do usuário com o cluster

- **Tipos de Interação**: Visualizações, likes, comentários, compartilhamentos, salvamentos
- **Decaimento Temporal**: Peso diminui com o tempo (meias-vidas configuráveis)
- **Qualidade das Interações**: Diferentes pesos para diferentes tipos de ação

**Peso Padrão**: 0.25 (configurável)

### 3. Novidade (NoveltyMetrics)
**Objetivo**: Promover descoberta de novo conteúdo

- **Conteúdo Não Visualizado**: Penaliza conteúdo já visto pelo usuário
- **Novidade de Tópicos**: Introduz novos temas e categorias
- **Decaimento de Novidade**: Conteúdo antigo perde relevância

**Peso Padrão**: 0.15 (configurável)

### 4. Diversidade (DiversityMetrics)
**Objetivo**: Evitar bolhas de filtro e promover variedade

- **Diversidade de Tópicos**: Variedade de temas nos clusters
- **Diversidade de Criadores**: Diferentes autores e fontes
- **Diversidade de Formatos**: Variedade de tipos de conteúdo

**Peso Padrão**: 0.1 (configurável)

### 5. Temporal (TemporalMetrics)
**Objetivo**: Considerar relevância baseada em tempo

- **Hora do Dia**: Ajustes baseados no horário de uso
- **Dia da Semana**: Comportamento diferente em fins de semana
- **Frescor do Conteúdo**: Conteúdo mais recente tem prioridade

**Peso Padrão**: 0.1 (configurável)

### 6. Qualidade (QualityMetrics)
**Objetivo**: Avaliar propriedades estruturais do cluster

- **Coesão**: Similaridade interna dos itens do cluster
- **Tamanho**: Número ótimo de itens no cluster
- **Densidade**: Proximidade média entre itens
- **Estabilidade**: Consistência ao longo do tempo

**Peso Padrão**: 0.1 (configurável)

## Ajustes Contextuais

### Baseados no Perfil do Usuário

```typescript
// Usuários com muitas interações recebem mais diversidade
if (interactionCount > 100) {
    diversity += 0.1
    affinity -= 0.05
    novelty += 0.05
}
```

### Baseados no Tempo

```typescript
// Noite: priorizar qualidade sobre engajamento
if (hour >= 20 || hour <= 5) {
    quality += 0.1
    engagement -= 0.05
}

// Fins de semana: priorizar novidade
if (day === 0 || day === 6) {
    novelty += 0.1
    quality -= 0.05
}
```

## Configuração

### Parâmetros Principais

Todos os parâmetros são configuráveis através do arquivo `params.ts`:

```typescript
export const ClusterRankingParams = {
    engagementFactors: {
        recency: {
            halfLifeHours: {
                partialView: 24,
                completeView: 48,
                like: 168,
                likeComment: 192,
                comment: 336,
                share: 336,
                save: 720
            }
        },
        interactionWeights: {
            partialView: 0.5,
            completeView: 1.0,
            like: 2.0,
            likeComment: 2.5,
            comment: 3.0,
            share: 4.0,
            save: 3.5
        }
    },
    // ... outras configurações
}
```

### Pesos Base

```typescript
const baseWeights = {
    affinity: 0.4,
    engagement: 0.25,
    novelty: 0.15,
    diversity: 0.1,
    temporal: 0.1,
    quality: 0.1
}
```

## Uso

### Exemplo Básico

```typescript
import { ClusterRankingAlgorithm } from './ClusterRankingAlgorithm'

const algorithm = new ClusterRankingAlgorithm()

const results = algorithm.rankClusters(
    clusters,
    userEmbedding,
    userProfile,
    context
)

console.log('Clusters ranqueados:', results)
```

### Exemplo com Contexto

```typescript
const context: RecommendationContext = {
    timeOfDay: 14, // 14:00
    dayOfWeek: 1,  // Segunda-feira
    location: 'São Paulo',
    device: 'mobile'
}

const results = algorithm.rankClusters(
    clusters,
    userEmbedding,
    userProfile,
    context
)
```

### Exemplo com Estatísticas

```typescript
const results = algorithm.rankClusters(clusters, userEmbedding, userProfile)
const stats = algorithm.getRankingStats(results)

console.log('Estatísticas:', {
    totalClusters: stats.totalClusters,
    averageScore: stats.averageScore,
    topClusters: stats.topClusters,
    confidenceStats: stats.confidenceStats
})
```

## Estrutura de Resultado

```typescript
interface ClusterRankingResult {
    clusterId: string
    score: number                    // Score final (0-1)
    componentScores: {
        affinity: number            // Score de afinidade
        engagement: number          // Score de engajamento
        novelty: number             // Score de novidade
        diversity: number           // Score de diversidade
        temporal: number            // Score temporal
        quality: number             // Score de qualidade
    }
    confidence: number              // Nível de confiança (0-1)
    metadata: {
        clusterName: string
        clusterSize: number
        weights: object             // Pesos aplicados
        clusterTopics: string[]     // Tópicos do cluster
    }
}
```

## Cálculo de Confiança

O nível de confiança é calculado baseado na variância dos scores ponderados:

```typescript
// Calcular variância dos scores ponderados
const weightedScores = [
    scores.affinity * weights.affinity,
    scores.engagement * weights.engagement,
    // ... outros scores
]

// Calcular variância
const variance = calculateVariance(weightedScores)

// Normalizar para score de confiança
const confidence = 1 - Math.min(1, Math.sqrt(variance) * 2)
```

**Interpretação**:
- **Alta confiança (0.8-1.0)**: Scores consistentes, alta confiabilidade
- **Média confiança (0.5-0.8)**: Alguma variação, confiabilidade moderada
- **Baixa confiança (0.0-0.5)**: Scores inconsistentes, baixa confiabilidade

## Tratamento de Erros

### Fallbacks Implementados

1. **Dados Insuficientes**: Score neutro (0.5) quando não há informações
2. **Erros de Cálculo**: Scores neutros com confiança baixa (0.1)
3. **Embedding Ausente**: Cálculo baseado em interesses compartilhados
4. **Interações Ausentes**: Score ligeiramente abaixo do neutro (0.4)

### Logging

```typescript
// Logs de informação
logger.info(`Ranqueando ${clusters.length} clusters para usuário`)

// Logs de erro
logger.error(`Erro ao ranquear cluster ${cluster.id}: ${error}`)
logger.error(`Erro geral no algoritmo de ranqueamento: ${error}`)
```

## Performance

### Otimizações Implementadas

1. **Limite de Interações**: Máximo 100 interações por usuário
2. **Decaimento Temporal**: Interações antigas têm impacto mínimo
3. **Processamento em Lote**: Múltiplos clusters processados eficientemente
4. **Cache de Pesos**: Pesos calculados uma vez por execução

### Complexidade

- **Tempo**: O(n × m) onde n = número de clusters, m = número de interações
- **Espaço**: O(n) para armazenar resultados
- **Memória**: O(m) para processar interações

## Monitoramento

### Métricas Disponíveis

```typescript
interface RankingStats {
    totalClusters: number
    averageScore: number
    scoreDistribution: {
        '0.0-0.2': number
        '0.2-0.4': number
        '0.4-0.6': number
        '0.6-0.8': number
        '0.8-1.0': number
    }
    topClusters: string[]
    confidenceStats: {
        average: number
        min: number
        max: number
    }
}
```

### Distribuição de Scores

- **0.0-0.2**: Clusters de baixa relevância
- **0.2-0.4**: Clusters de relevância moderada-baixa
- **0.4-0.6**: Clusters de relevância neutra
- **0.6-0.8**: Clusters de relevância moderada-alta
- **0.8-1.0**: Clusters de alta relevância

## Considerações de Design

### Princípios

1. **Configurabilidade**: Todos os parâmetros são ajustáveis
2. **Robustez**: Tratamento de erros e fallbacks
3. **Performance**: Otimizações para processamento eficiente
4. **Monitoramento**: Métricas detalhadas para análise
5. **Extensibilidade**: Fácil adição de novas métricas

### Trade-offs

- **Precisão vs. Performance**: Mais métricas = mais precisão, mas menor performance
- **Simplicidade vs. Complexidade**: Algoritmo complexo para resultados precisos
- **Configurabilidade vs. Simplicidade**: Muitos parâmetros para máxima flexibilidade

## Extensibilidade

### Adicionando Novas Métricas

1. Criar nova classe de métricas
2. Implementar interface `MetricFactors`
3. Adicionar ao cálculo de score final
4. Configurar pesos no `params.ts`

### Exemplo

```typescript
// Nova métrica de popularidade
const popularityScore = calculatePopularityScore(cluster, factors)
const finalScore = 
    (affinityScore * weights.affinity) +
    (engagementScore * weights.engagement) +
    (popularityScore * weights.popularity) + // Nova métrica
    // ... outras métricas
```

## Troubleshooting

### Problemas Comuns

1. **Scores Baixos**: Verificar dados de entrada e configurações
2. **Baixa Confiança**: Verificar consistência das métricas
3. **Performance Lenta**: Reduzir número de interações ou clusters
4. **Erros de Tipo**: Verificar compatibilidade de dados de entrada

### Debug

```typescript
// Habilitar logs detalhados
const results = algorithm.rankClusters(clusters, userEmbedding, userProfile)
console.log('Component scores:', results[0].componentScores)
console.log('Weights applied:', results[0].metadata.weights)
console.log('Confidence:', results[0].confidence)
```

## Conclusão

O `ClusterRankingAlgorithm` é um sistema robusto e configurável para ranqueamento de clusters que combina múltiplas métricas para fornecer recomendações personalizadas e relevantes. Sua arquitetura modular permite fácil extensão e ajuste para diferentes cenários de uso. 