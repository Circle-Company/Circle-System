# Documentação dos Parâmetros de Configuração

Este documento descreve todas as seções e variáveis do arquivo `params.ts`, explicando o propósito e funcionamento de cada parâmetro utilizado no sistema de ranqueamento, recomendação e embeddings.

---

## 📊 EmbeddingParams

### ⏰ timeWindows

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `recentEmbeddingUpdate` | 24 horas | Tempo máximo desde a última atualização do embedding. Define após quanto tempo um embedding é considerado desatualizado, controlando a frequência de atualização dos embeddings dos usuários. Equilibra precisão vs. custo computacional. |
| `interactionHistory` | 30 dias | Período de histórico de interações considerado. Define o período de interações que influenciam o embedding. Interações mais antigas que este período têm menor impacto. |

### 📏 dimensions

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `embedding` | 128 | Dimensão total do vetor de embedding. Define o tamanho do vetor de embedding final. Valores maiores capturam mais nuances e características, valores menores reduzem o custo computacional. |
| `interactionHistory` | 50 | Dimensões dedicadas ao histórico de interações. Parte do vetor que representa padrões de interação. |
| `contentPreferences` | 20 | Dimensões dedicadas às preferências de conteúdo. Parte do vetor que representa preferências explícitas. |
| `socialFeatures` | 30 | Dimensões dedicadas a características sociais. Parte do vetor que representa conexões e dinâmicas sociais. |

### ⚖️ weights

#### Content Weights
| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `content.text` | 0.5 | Peso do texto no embedding de conteúdo. Importância do conteúdo textual na geração do embedding. |
| `content.tags` | 0.3 | Peso das tags no embedding de conteúdo. Importância de categorias e tags na geração do embedding. |
| `content.engagement` | 0.2 | Peso do engajamento no embedding de conteúdo. Importância das métricas de engajamento na geração do embedding. |

#### Interaction Weights
| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `interactions.view` | 0.1 | Impacto de uma visualização no embedding do usuário. |
| `interactions.like` | 0.3 | Impacto de um like no embedding do usuário. |
| `interactions.comment` | 0.5 | Impacto de um comentário no embedding do usuário. |
| `interactions.share` | 0.7 | Impacto de um compartilhamento no embedding do usuário. |
| `interactions.save` | 0.6 | Impacto de salvar o conteúdo no embedding do usuário. |
| `interactions.default` | 0.2 | Peso padrão para interações não especificadas. |

#### Update Weights
| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `update.default` | 0.5 | Taxa de atualização padrão para embeddings. Controla o quanto novas interações alteram o embedding existente. |

### 🔍 similarity

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `defaultLimit` | 10 | Limite padrão para resultados de similaridade. Número de itens semelhantes a retornar por padrão. |
| `minimumThreshold` | 0.7 | Limiar mínimo de similaridade. Score mínimo para considerar dois itens como similares. |

### 🔄 batchProcessing

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `size` | 100 | Tamanho do lote para processamento. Número de itens processados em cada lote. |

### 📈 normalization

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `engagementLogBase` | 10 | Base logarítmica para normalização de engajamento. Usada para suavizar valores de engajamento com grande variação. |
| `engagementScaleFactor` | 5 | Fator de escala para engajamento. Multiplicador aplicado após normalização logarítmica. |

### 📉 decay

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `interactionWeight.base` | 24 horas | Taxa de decaimento base para interações. Define o período base para decaimento de relevância das interações. |
| `interactionWeight.minimum` | 0.1 | Peso mínimo após decaimento. Valor mínimo que uma interação pode atingir após decaimento. |

### 🎯 feedback

#### Interaction Strengths
| Tipo de Interação | Peso | Descrição |
|-------------------|------|-----------|
| `short_view` | 0.1 | Visualização rápida do conteúdo |
| `long_view` | 0.3 | Visualização prolongada do conteúdo |
| `like` | 0.5 | Curtida do conteúdo |
| `like_comment` | 0.7 | Curtida de comentário |
| `share` | 0.8 | Compartilhamento do conteúdo |
| `comment` | 0.6 | Comentário no conteúdo |
| `dislike` | -0.3 | Descurtida do conteúdo |
| `show_less_often` | -0.5 | Solicitação para mostrar menos |
| `report` | -0.8 | Denúncia do conteúdo |

#### Learning Rates
| Categoria | Tipo | Valor | Descrição |
|-----------|------|-------|-----------|
| **User** | `highPriority` | 0.1 | Taxa de aprendizado para interações de alta prioridade |
| **User** | `normal` | 0.05 | Taxa de aprendizado normal |
| **Post** | `highPriority` | 0.05 | Taxa para posts com interações importantes |
| **Post** | `normal` | 0.02 | Taxa normal para posts |
| **Post** | `networkEffect` | 0.005 | Taxa para efeitos de rede |

#### Engagement Settings
| Configuração | Valores | Descrição |
|--------------|---------|-----------|
| `timeThresholds` | 5, 30, 60 segundos | Limiares para engajamento curto, médio e longo |
| `watchPercentages` | 0.2, 0.8 | Percentuais baixo e alto de visualização |
| `timeMultipliers` | 0.5, 1.5 | Multiplicadores para tempo curto e longo |
| `watchMultipliers` | 0.7, 1.3 | Multiplicadores para visualização parcial e completa |

#### Network Effects
| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `similarPostsLimit` | 5 | Limite de posts similares |
| `similarityThreshold` | 0.8 | Limiar de similaridade para efeitos de rede |

#### High Priority Interactions
- `like`
- `share`
- `like_comment`
- `report`

### 🎲 candidateSelector

#### Weights
| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `clusterScore` | 0.4 | Peso do score do cluster |
| `recency` | 0.3 | Peso da recência |
| `engagement` | 0.2 | Peso do engajamento |
| `random` | 0.1 | Componente aleatório |

#### Thresholds
| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `minimumClusterScore` | 0.2 | Score mínimo para considerar um cluster |
| `timeWindow` | 168 horas (7 dias) | Janela de tempo padrão |
| `defaultLimit` | 30 | Limite padrão de candidatos |
| `bufferSize` | 5 | Buffer extra por cluster |

---

## 🎯 FeedRecommendationParams

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `defaultOptions.limit` | 20 | Limite de recomendações |
| `defaultOptions.diversity` | 0.4 | Fator de diversidade |
| `defaultOptions.novelty` | 0.3 | Fator de novidade |
| `defaultOptions.context.timeOfDay` | 0-23 | Hora do dia |
| `defaultOptions.context.dayOfWeek` | 0-6 | Dia da semana |

---

## 🏆 RankingParams

### Weights
| Componente | Peso | Descrição |
|------------|------|-----------|
| `relevance` | 0.4 | Relevância do conteúdo para o usuário |
| `engagement` | 0.25 | Potencial de engajamento |
| `novelty` | 0.15 | Novidade do conteúdo |
| `diversity` | 0.1 | Diversidade da recomendação |
| `context` | 0.1 | Contexto temporal e situacional |

### Configurações Gerais
| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `noveltyLevel` | 0.3 | Nível de novidade desejado |
| `diversityLevel` | 0.4 | Nível de diversidade desejado |
| `maxTags` | 10 | Número máximo de tags para normalização |

### Decay Settings
- Configurações de decaimento temporal para diferentes tipos de conteúdo

### Default Scores
- Scores padrão para cada dimensão de ranking

### Diversity Weights
- Pesos para cálculo de diversidade entre recomendações

### Context Weights
- Pesos para cálculo de relevância contextual

---

## 🎪 ClusterRankingParams

### Engagement Factors
| Fator | Descrição |
|-------|-----------|
| `recency` | Influência da recência do conteúdo |
| `interactionWeights` | Pesos para diferentes tipos de interação |
| `timeDecayFactor` | Fator de decaimento temporal |
| `maxInteractionsPerUser` | Limite máximo de interações por usuário |
| `normalizationFactor` | Fator de normalização |
| `defaultInteractionWeights` | Pesos padrão para interações |

### Novelty Factors
| Fator | Descrição |
|-------|-----------|
| `viewedContentWeight` | Peso para conteúdo já visualizado |
| `topicNoveltyWeight` | Peso para novidade de tópicos |
| `noveltyDecayPeriodDays` | Período de decaimento da novidade |
| `similarContentDiscount` | Desconto para conteúdo similar |

### Diversity Factors
| Fator | Descrição |
|-------|-----------|
| `topicDiversityWeight` | Peso para diversidade de tópicos |
| `creatorDiversityWeight` | Peso para diversidade de criadores |
| `formatDiversityWeight` | Peso para diversidade de formatos |
| `recentClustersToConsider` | Número de clusters recentes a considerar |

### Quality Factors
| Fator | Descrição |
|-------|-----------|
| `cohesionWeight` | Peso para coesão do cluster |
| `sizeWeight` | Peso para tamanho do cluster |
| `densityWeight` | Peso para densidade do cluster |
| `stabilityWeight` | Peso para estabilidade do cluster |
| `minOptimalSize` | Tamanho mínimo ideal |
| `maxOptimalSize` | Tamanho máximo ideal |

### User Profile Adjustments
| Ajuste | Descrição |
|--------|-----------|
| `highInteractionThreshold` | Limiar para usuários de alta interação |
| `diversityIncrease` | Aumento de diversidade para usuários específicos |
| `affinityDecrease` | Redução de afinidade para balanceamento |
| `noveltyIncrease` | Aumento de novidade para usuários específicos |

### Temporal Adjustments
| Período | Descrição |
|---------|-----------|
| `nightTime` | Ajustes para período noturno |
| `lunchTime` | Ajustes para horário de almoço |
| `weekend` | Ajustes para fins de semana |

### Confidence & Statistics
| Configuração | Descrição |
|--------------|-----------|
| `confidence.varianceMultiplier` | Multiplicador de variância para confiança |
| `statistics.topClustersCount` | Número de clusters top para estatísticas |
| `statistics.scoreDistributionLimits` | Limites para distribuição de scores |

### Fallback Settings
| Configuração | Descrição |
|--------------|-----------|
| `fallback.neutralScore` | Score neutro para casos de fallback |
| `fallback.errorConfidence` | Confiança para erros |
| `fallback.maxTopicsInMetadata` | Máximo de tópicos nos metadados |

---

## ⚙️ clusterRankingConfig

### Base Weights
| Componente | Peso | Descrição |
|------------|------|-----------|
| `affinity` | 0.3 | Afinidade entre usuário e conteúdo |
| `engagement` | 0.25 | Potencial de engajamento |
| `novelty` | 0.2 | Novidade do conteúdo |
| `diversity` | 0.15 | Diversidade da recomendação |
| `temporal` | 0.05 | Relevância temporal |
| `quality` | 0.05 | Qualidade do cluster |

### Affinity Factors
| Fator | Descrição |
|-------|-----------|
| `embeddingSimilarityWeight` | Peso para similaridade de embeddings |
| `sharedInterestsWeight` | Peso para interesses compartilhados |
| `networkProximityWeight` | Peso para proximidade na rede |

### Engagement Factors
| Fator | Descrição |
|-------|-----------|
| `recency` | Influência da recência |
| `interactionWeights` | Pesos para diferentes interações |
| `timeDecayFactor` | Fator de decaimento temporal |

### Novelty Factors
| Fator | Descrição |
|-------|-----------|
| `viewedContentWeight` | Peso para conteúdo já visualizado |
| `topicNoveltyWeight` | Peso para novidade de tópicos |
| `noveltyDecayPeriodDays` | Período de decaimento da novidade |
| `similarContentDiscount` | Desconto para conteúdo similar |

### Diversity Factors
| Fator | Descrição |
|-------|-----------|
| `topicDiversityWeight` | Peso para diversidade de tópicos |
| `creatorDiversityWeight` | Peso para diversidade de criadores |
| `formatDiversityWeight` | Peso para diversidade de formatos |
| `recentClustersToConsider` | Número de clusters recentes a considerar |

### Temporal Factors
| Fator | Descrição |
|-------|-----------|
| `hourOfDayWeights` | Pesos para diferentes horas do dia |
| `dayOfWeekWeights` | Pesos para diferentes dias da semana |
| `contentFreshnessWeight` | Peso para frescor do conteúdo |
| `temporalEventWeight` | Peso para eventos temporais |

### Quality Factors
| Fator | Descrição |
|-------|-----------|
| `cohesionWeight` | Peso para coesão do cluster |
| `sizeWeight` | Peso para tamanho do cluster |
| `densityWeight` | Peso para densidade do cluster |
| `stabilityWeight` | Peso para estabilidade do cluster |
| `minOptimalSize` | Tamanho mínimo ideal |
| `maxOptimalSize` | Tamanho máximo ideal |

### Diversification
| Configuração | Valor | Descrição |
|--------------|-------|-----------|
| `enabled` | true | Habilita diversificação de resultados |
| `temperature` | 0.8 | Temperatura para diversificação |
| `method` | "mmr" | Método de diversificação (MMR) |
| `mmrLambda` | 0.5 | Parâmetro lambda para MMR |

### Feedback Settings
| Configuração | Valor | Descrição |
|--------------|-------|-----------|
| `enabled` | true | Habilita feedback em tempo real |
| `positiveAdjustment` | 0.1 | Ajuste para feedback positivo |
| `negativeAdjustment` | -0.1 | Ajuste para feedback negativo |

---

## 👥 userTypeConfigs

### New User
| Modificador | Valor | Descrição |
|-------------|-------|-----------|
| `weightModifiers` | Configurações específicas | Modificadores de peso para usuários novos |

### Power User
| Modificador | Valor | Descrição |
|-------------|-------|-----------|
| `weightModifiers` | Configurações específicas | Modificadores de peso para usuários muito ativos |

### Casual User
| Modificador | Valor | Descrição |
|-------------|-------|-----------|
| `weightModifiers` | Configurações específicas | Modificadores de peso para usuários casuais |

---

## ⏰ temporalDecayConfig

| Tipo de Conteúdo | Half-Life | Max Age | Descrição |
|------------------|-----------|---------|-----------|
| `news` | 6 horas | 7 dias | Configuração para conteúdo relacionado a notícias/atualidades |
| `educational` | 24 horas | 30 dias | Configuração para conteúdo educacional/informativo |
| `entertainment` | 48 horas | 90 dias | Configuração para conteúdo de entretenimento |
| `default` | 12 horas | 14 dias | Configuração padrão para outros tipos de conteúdo |

---

## 📝 Notas Importantes

- Todos os valores são configuráveis e podem ser ajustados conforme as necessidades específicas do sistema
- Os pesos devem somar 1.0 quando aplicáveis para manter a normalização
- As configurações de decaimento temporal são cruciais para manter a relevância do conteúdo
- O feedback em tempo real permite ajustes dinâmicos baseados no comportamento do usuário
- A diversificação ajuda a evitar "bolhas de filtro" e manter a variedade de conteúdo 