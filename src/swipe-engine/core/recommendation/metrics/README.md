# Sistema de Métricas para Ranqueamento de Clusters

## Visão Geral

Este sistema implementa um algoritmo multi-fatorial para ranqueamento de clusters, considerando 6 dimensões principais de relevância:

1. **AffinityMetrics** - Afinidade semântica entre usuário e cluster
2. **DiversityMetrics** - Diversidade de conteúdo e criadores
3. **EngagementMetrics** - Histórico de engajamento do usuário
4. **NoveltyMetrics** - Novidade do conteúdo para o usuário
5. **TemporalMetrics** - Relevância temporal e contextual
6. **QualityMetrics** - Qualidade intrínseca do cluster

## Arquitetura do Sistema

```
ClusterRankingAlgorithm
├── AffinityMetrics (30-40% do peso)
├── EngagementMetrics (20-30% do peso)
├── NoveltyMetrics (15-25% do peso)
├── DiversityMetrics (10-20% do peso)
├── TemporalMetrics (10-15% do peso)
└── QualityMetrics (5-10% do peso)
```

## 1. AffinityMetrics - Afinidade Semântica

### Funcionamento
A **AffinityMetrics** mede o alinhamento semântico entre o usuário e o cluster através de:

#### 1.1 Similaridade de Embeddings (60-80% do peso)
- **Algoritmo**: Similaridade de cosseno entre embedding do usuário e centroide do cluster
- **Fórmula**: `cosine_similarity(user_vector, cluster_centroid)`
- **Normalização**: `(cosine_sim + 1) / 2` para converter de [-1,1] para [0,1]

#### 1.2 Similaridade de Tópicos (20-40% do peso)
- **Algoritmo**: Similaridade de Jaccard entre interesses do usuário e tópicos do cluster
- **Fórmula**: `|A ∩ B| / |A ∪ B|`
- **Processamento**: Normalização de texto (lowercase, remoção de acentos)
- **Ajuste**: Função sigmóide para suavizar extremos

#### 1.3 Proximidade na Rede (10-30% do peso)
- **Algoritmo**: Análise de padrões de interação histórica
- **Fatores**: Tipo de interação, recência temporal, similaridade de tópicos
- **Decaimento**: Exponencial baseado em idade da interação

#### 1.4 Centralidade do Cluster (5-15% do peso)
- **Fatores**: Tamanho, densidade, diversidade de tópicos
- **Objetivo**: Clusters mais centrais tendem a ter maior afinidade geral

### Configuração Recomendada
```typescript
const affinityFactors = {
    embeddingSimilarityWeight: 0.7,    // 70% - Similaridade vetorial
    sharedInterestsWeight: 0.2,         // 20% - Interesses explícitos
    networkProximityWeight: 0.1,        // 10% - Proximidade na rede
    clusterCentralityWeight: 0.05,      // 5% - Centralidade
    minSimilarityThreshold: 0.3,        // Limiar mínimo
    topicDecayFactor: 0.8,              // Decaimento de tópicos
    maxHistoricalInteractions: 100      // Interações históricas
}
```

## 2. DiversityMetrics - Diversidade de Conteúdo

### Funcionamento
A **DiversityMetrics** evita bolhas de filtro e promove descoberta através de:

#### 2.1 Diversidade de Tópicos (50% do peso)
- **Algoritmo**: Contagem de tópicos novos vs. conhecidos
- **Fórmula**: `novos_tópicos / total_tópicos`
- **Ajuste**: Curva em forma de sino centrada em 0.7 (diversidade ótima)

#### 2.2 Diversidade de Criadores (30% do peso)
- **Algoritmo**: Análise de criadores de conteúdo
- **Objetivo**: Evitar concentração em poucos criadores
- **Métrica**: Distribuição de criadores no cluster

#### 2.3 Diversidade de Formatos (20% do peso)
- **Algoritmo**: Variedade de tipos de conteúdo
- **Tipos**: Vídeo, texto, imagem, áudio, etc.
- **Métrica**: Entropia da distribuição de formatos

### Configuração Recomendada
```typescript
const diversityFactors = {
    topicDiversityWeight: 0.5,          // 50% - Tópicos
    creatorDiversityWeight: 0.3,        // 30% - Criadores
    formatDiversityWeight: 0.2,         // 20% - Formatos
    recentClustersToConsider: 10        // Clusters recentes
}
```

## 3. EngagementMetrics - Histórico de Engajamento

### Funcionamento
A **EngagementMetrics** analisa padrões de comportamento através de:

#### 3.1 Tipos de Interação (Pesos Diferentes)
```typescript
const interactionWeights = {
    view: 1.0,           // Visualização básica
    like: 2.0,           // Curtida
    comment: 3.0,        // Comentário
    share: 4.0,          // Compartilhamento
    save: 5.0            // Salvamento
}
```

#### 3.2 Decaimento Temporal
- **Algoritmo**: Decaimento exponencial baseado em meia-vida
- **Fórmula**: `exp(-ln(2) * age_hours / half_life)`
- **Meias-vidas**:
  - Visualizações: 48 horas
  - Curtidas: 168 horas (1 semana)
  - Comentários: 336 horas (2 semanas)
  - Compartilhamentos: 336 horas (2 semanas)
  - Salvamentos: 720 horas (1 mês)

#### 3.3 Normalização
- **Fórmula**: `1 - exp(-total_score * normalization_factor)`
- **Objetivo**: Suavizar extremos e normalizar para [0,1]

### Configuração Recomendada
```typescript
const engagementFactors = {
    recency: {
        halfLifeHours: {
            view: 48, like: 168, comment: 336, share: 336, save: 720
        }
    },
    interactionWeights: {
        view: 1.0, like: 2.0, comment: 3.0, share: 4.0, save: 5.0
    },
    timeDecayFactor: 0.9,
    maxInteractionsPerUser: 100,
    normalizationFactor: 0.1
}
```

## 4. NoveltyMetrics - Novidade do Conteúdo

### Funcionamento
A **NoveltyMetrics** promove descoberta e evita repetição através de:

#### 4.1 Novidade de Conteúdo (70% do peso)
- **Algoritmo**: Análise de conteúdo já visualizado
- **Fórmula**: `1 - (interaction_count / 100)` com decaimento linear
- **Ajuste**: Garantir mínimo de 0.3 para evitar penalização excessiva

#### 4.2 Novidade de Tópicos (30% do peso)
- **Algoritmo**: Análise de tópicos já explorados
- **Fórmula**: Escala linear baseada no número de tópicos
- **Ranges**:
  - ≤2 tópicos: 0.4 (baixa novidade)
  - 3-9 tópicos: 0.4 + (count-2) * 0.5/8
  - ≥10 tópicos: 0.9 (alta novidade)

### Configuração Recomendada
```typescript
const noveltyFactors = {
    viewedContentWeight: 0.7,           // 70% - Conteúdo
    topicNoveltyWeight: 0.3,            // 30% - Tópicos
    noveltyDecayPeriodDays: 30,         // Período de decaimento
    similarContentDiscount: 0.5         // Desconto para similar
}
```

## 5. TemporalMetrics - Relevância Temporal

### Funcionamento
A **TemporalMetrics** considera contexto temporal através de:

#### 5.1 Relevância por Hora do Dia (40% do peso)
```typescript
const hourWeights = {
    morning: 0.8,    // 6-11h
    midday: 0.6,     // 11-14h
    afternoon: 0.7,  // 14-18h
    evening: 0.9,    // 18-22h
    night: 0.5       // 22-6h
}
```

#### 5.2 Relevância por Dia da Semana (20% do peso)
```typescript
const dayWeights = {
    weekday: 0.7,    // Segunda a Sexta
    weekend: 0.9     // Sábado e Domingo
}

// Ajustes específicos por dia
const dayAdjustments = {
    0: 0.1,   // Domingo: +0.1
    1: -0.1,  // Segunda: -0.1
    5: 0.2,   // Sexta: +0.2
    6: 0.1    // Sábado: +0.1
}
```

#### 5.3 Frescor do Conteúdo (30% do peso)
- **Algoritmo**: Decaimento exponencial baseado em idade
- **Fórmula**: `exp(-ln(2) * age_hours / half_life)`
- **Meia-vida padrão**: 24 horas
- **Ajuste**: `0.3 + 0.7 * freshness` para garantir mínimo

#### 5.4 Eventos Temporais (10% do peso)
- **Feriados**: Aumento de 0.2 no score
- **Horários especiais**: Aumento de 0.1 no score
- **Decaimento**: `score^decay_factor`

### Configuração Recomendada
```typescript
const temporalFactors = {
    hourOfDayWeights: {
        morning: 0.8, midday: 0.6, afternoon: 0.7, evening: 0.9, night: 0.5
    },
    dayOfWeekWeights: {
        weekday: 0.7, weekend: 0.9
    },
    contentFreshnessWeight: 0.4,
    temporalEventWeight: 0.2,
    contentHalfLifeHours: 24,
    eventDecayFactor: 0.8,
    historicalDays: 30
}
```

## 6. QualityMetrics - Qualidade Intrínseca

### Funcionamento
A **QualityMetrics** avalia propriedades estruturais do cluster:

#### 6.1 Score de Tamanho (25% do peso)
- **Algoritmo**: Função em forma de sino
- **Tamanho ideal**: Entre `minOptimalSize` e `maxOptimalSize`
- **Penalização**: Linear para tamanhos fora do ideal

#### 6.2 Score de Coesão (25% do peso)
- **Algoritmo**: Similaridade média entre membros do cluster
- **Objetivo**: Clusters mais coesos são preferidos
- **Métrica**: Média das similaridades internas

#### 6.3 Score de Densidade (25% do peso)
- **Algoritmo**: Proximidade média ao centroide
- **Fórmula**: `1 / (1 + avg_distance_to_centroid)`
- **Objetivo**: Clusters mais densos são preferidos

#### 6.4 Score de Estabilidade (25% do peso)
- **Algoritmo**: Consistência ao longo do tempo
- **Métrica**: Variação do centroide entre atualizações
- **Objetivo**: Clusters estáveis são preferidos

### Configuração Recomendada
```typescript
const qualityFactors = {
    cohesionWeight: 0.4,                // 40% - Coesão
    sizeWeight: 0.2,                    // 20% - Tamanho
    densityWeight: 0.2,                 // 20% - Densidade
    stabilityWeight: 0.2,               // 20% - Estabilidade
    minOptimalSize: 5,                  // Tamanho mínimo ideal
    maxOptimalSize: 50                  // Tamanho máximo ideal
}
```

## Combinação Final dos Scores

### Algoritmo de Combinação
```typescript
const finalScore = 
    (affinityScore * weights.affinity) +
    (engagementScore * weights.engagement) +
    (noveltyScore * weights.novelty) +
    (diversityScore * weights.diversity) +
    (temporalScore * weights.temporal) +
    (qualityScore * weights.quality)
```

### Pesos Base Recomendados
```typescript
const baseWeights = {
    affinity: 0.35,     // 35% - Afinidade (principal)
    engagement: 0.25,   // 25% - Engajamento
    novelty: 0.20,      // 20% - Novidade
    diversity: 0.10,    // 10% - Diversidade
    temporal: 0.07,     // 7% - Temporal
    quality: 0.03       // 3% - Qualidade
}
```

### Ajustes Contextuais
- **Usuários com muitas interações**: +diversidade, +novidade, -afinidade
- **Horário noturno**: +qualidade, -engajamento
- **Horário de almoço**: +temporal, -engajamento
- **Fins de semana**: +novidade, -qualidade

## Cálculo de Confiança

### Algoritmo
```typescript
// Calcular variância dos scores ponderados
const weightedScores = [affinity*weight, engagement*weight, ...]
const mean = average(weightedScores)
const variance = sum((score - mean)²) / count

// Confiança baseada na consistência
const confidence = 1 - min(1, sqrt(variance) * 2)
```

### Interpretação
- **Confiança > 0.8**: Scores muito consistentes
- **Confiança 0.5-0.8**: Scores moderadamente consistentes
- **Confiança < 0.5**: Scores inconsistentes (baixa confiança)

## Uso Prático

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

// Resultados ordenados por score
results.forEach(result => {
    console.log(`${result.clusterId}: ${result.score.toFixed(3)}`)
    console.log(`  Afinidade: ${result.componentScores.affinity.toFixed(3)}`)
    console.log(`  Engajamento: ${result.componentScores.engagement.toFixed(3)}`)
    // ... outros componentes
})
```

### Análise de Estatísticas
```typescript
const stats = algorithm.getRankingStats(results)
console.log(`Score médio: ${stats.averageScore}`)
console.log(`Confiança média: ${stats.confidenceStats.average}`)
console.log(`Distribuição:`, stats.scoreDistribution)
```

## Monitoramento e Ajustes

### Métricas de Monitoramento
- Distribuição de scores por componente
- Taxa de confiança média
- Variação temporal dos rankings
- Correlação entre scores e engajamento real

### Ajustes Recomendados
- **Baixo engajamento**: Aumentar peso de afinidade
- **Bolhas de filtro**: Aumentar peso de diversidade
- **Baixa descoberta**: Aumentar peso de novidade
- **Baixa qualidade**: Aumentar peso de qualidade

## Considerações de Performance

### Otimizações
- Cache de embeddings calculados
- Limitação de interações históricas
- Pré-cálculo de métricas estáticas
- Paralelização de cálculos independentes

### Complexidade
- **Tempo**: O(n * m) onde n=clusters, m=métricas
- **Espaço**: O(n) para armazenar resultados
- **Cache**: O(k) onde k=usuários únicos

Este sistema fornece uma base robusta para ranqueamento de clusters, permitindo ajustes finos baseados em dados reais de engajamento e feedback dos usuários. 