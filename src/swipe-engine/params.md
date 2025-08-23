# Documentação dos Parâmetros de Configuração

Este documento descreve todas as seções e variáveis do arquivo `params.ts`, explicando o propósito e funcionamento de cada parâmetro utilizado no sistema de ranqueamento, recomendação e embeddings.

---

## 📊 EmbeddingParams

Os parâmetros de embedding controlam como os vetores de representação dos usuários e conteúdos são gerados e atualizados. Estes vetores são fundamentais para calcular similaridades e fazer recomendações precisas.

### ⏰ timeWindows

Esta seção define janelas de tempo que controlam quando e como os embeddings são atualizados, balanceando precisão com eficiência computacional.

**`recentEmbeddingUpdate`** (24 horas)
- Tempo máximo desde a última atualização do embedding
- Define após quanto tempo um embedding é considerado desatualizado
- Controla a frequência de atualização dos embeddings dos usuários
- Equilibra precisão vs. custo computacional
- **Impacto**: Valores menores aumentam a precisão mas consomem mais recursos, valores maiores economizam processamento mas podem perder nuances recentes do comportamento do usuário

**`interactionHistory`** (30 dias)
- Período de histórico de interações considerado
- Define o período de interações que influenciam o embedding
- **Impacto**: Períodos maiores capturam padrões de longo prazo mas podem diluir mudanças recentes, períodos menores são mais responsivos mas podem perder contexto histórico

### 📏 dimensions

Esta seção define a estrutura dimensional dos vetores de embedding, dividindo o espaço vetorial em áreas especializadas para diferentes aspectos do comportamento e preferências do usuário.

**`embedding`** (128)
- Dimensão total do vetor de embedding
- Define o tamanho do vetor de embedding final
- Valores maiores capturam mais nuances e características
- Valores menores reduzem o custo computacional
- **Impacto**: Dimensões maiores permitem representações mais ricas mas aumentam o tempo de cálculo e armazenamento

**`interactionHistory`** (50)
- Dimensões dedicadas ao histórico de interações
- Parte do vetor que representa padrões de interação
- **Funcionamento**: Captura sequências de ações, frequência de interações e padrões temporais de engajamento

**`contentPreferences`** (20)
- Dimensões dedicadas às preferências de conteúdo
- Parte do vetor que representa preferências explícitas
- **Funcionamento**: Codifica tipos de conteúdo preferidos, formatos favoritos e categorias de interesse

**`socialFeatures`** (30)
- Dimensões dedicadas a características sociais
- Parte do vetor que representa conexões e dinâmicas sociais
- **Funcionamento**: Mapeia relacionamentos, influência social e padrões de compartilhamento

### ⚖️ weights

Esta seção define os pesos relativos de diferentes componentes na geração e atualização dos embeddings, controlando a importância de cada tipo de informação.

#### Content Weights
Controlam como diferentes aspectos do conteúdo influenciam o embedding do usuário.

**`content.text`** (0.5)
- Peso do texto no embedding de conteúdo
- Importância do conteúdo textual na geração do embedding
- **Funcionamento**: Analisa palavras-chave, tópicos e sentimento do texto para inferir interesses do usuário

**`content.tags`** (0.3)
- Peso das tags no embedding de conteúdo
- Importância de categorias e tags na geração do embedding
- **Funcionamento**: Usa categorização explícita para mapear preferências temáticas e de formato

**`content.engagement`** (0.2)
- Peso do engajamento no embedding de conteúdo
- Importância das métricas de engajamento na geração do embedding
- **Funcionamento**: Considera likes, comentários, compartilhamentos e tempo de visualização para inferir interesse real

#### Interaction Weights
Definem o impacto de cada tipo de interação na atualização do embedding do usuário.

**`interactions.view`** (0.1)
- Impacto de uma visualização no embedding do usuário
- **Funcionamento**: Sinal fraco de interesse, usado principalmente para confirmar exposição ao conteúdo

**`interactions.like`** (0.3)
- Impacto de um like no embedding do usuário
- **Funcionamento**: Sinal moderado de aprovação, indica preferência positiva pelo conteúdo

**`interactions.comment`** (0.5)
- Impacto de um comentário no embedding do usuário
- **Funcionamento**: Sinal forte de engajamento, indica interesse profundo e disposição para interagir

**`interactions.share`** (0.7)
- Impacto de um compartilhamento no embedding do usuário
- **Funcionamento**: Sinal muito forte de aprovação, indica que o usuário considera o conteúdo valioso o suficiente para recomendar

**`interactions.save`** (0.6)
- Impacto de salvar o conteúdo no embedding do usuário
- **Funcionamento**: Sinal forte de valor percebido, indica intenção de referência futura

**`interactions.default`** (0.2)
- Peso padrão para interações não especificadas
- **Funcionamento**: Valor de fallback para novos tipos de interação ainda não calibrados

#### Update Weights
Controlam a taxa de mudança dos embeddings em resposta a novas interações.

**`update.default`** (0.5)
- Taxa de atualização padrão para embeddings
- Controla o quanto novas interações alteram o embedding existente
- **Funcionamento**: Valores próximos a 1 fazem o embedding mudar rapidamente, valores próximos a 0 mantêm estabilidade

### 🔍 similarity

Esta seção controla como a similaridade entre embeddings é calculada e filtrada.

**`defaultLimit`** (10)
- Limite padrão para resultados de similaridade
- Número de itens semelhantes a retornar por padrão
- **Funcionamento**: Controla a quantidade de candidatos retornados, balanceando precisão com diversidade

**`minimumThreshold`** (0.7)
- Limiar mínimo de similaridade
- Score mínimo para considerar dois itens como similares
- **Funcionamento**: Filtra resultados irrelevantes, garantindo qualidade mínima das recomendações

### 🔄 batchProcessing

Esta seção otimiza o processamento em lote para eficiência computacional.

**`size`** (100)
- Tamanho do lote para processamento
- Número de itens processados em cada lote
- **Funcionamento**: Lotes maiores são mais eficientes mas consomem mais memória, lotes menores são mais responsivos mas menos eficientes

### 📈 normalization

Esta seção controla como os valores de engajamento são normalizados para comparação justa.

**`engagementLogBase`** (10)
- Base logarítmica para normalização de engajamento
- Usada para suavizar valores de engajamento com grande variação
- **Funcionamento**: Reduz o impacto de outliers extremos, tornando a comparação mais justa entre conteúdos populares e nicho

**`engagementScaleFactor`** (5)
- Fator de escala para engajamento
- Multiplicador aplicado após normalização logarítmica
- **Funcionamento**: Ajusta a magnitude dos valores normalizados para o range desejado

### 📉 decay

Esta seção implementa decaimento temporal para dar mais peso a interações recentes.

**`interactionWeight.base`** (24 horas)
- Taxa de decaimento base para interações
- Define o período base para decaimento de relevância das interações
- **Funcionamento**: Interações mais antigas que este período perdem relevância gradualmente, priorizando comportamento recente

**`interactionWeight.minimum`** (0.1)
- Peso mínimo após decaimento
- Valor mínimo que uma interação pode atingir após decaimento
- **Funcionamento**: Garante que interações importantes nunca sejam completamente esquecidas

### 🎯 feedback

Esta seção implementa aprendizado adaptativo baseado no feedback do usuário, permitindo que o sistema melhore suas recomendações ao longo do tempo.

#### Interaction Strengths
Define a força de cada tipo de interação no aprendizado do sistema.

**`short_view`** (0.1)
- Visualização rápida do conteúdo
- **Funcionamento**: Sinal mínimo de exposição, usado para confirmar que o conteúdo foi visto

**`long_view`** (0.3)
- Visualização prolongada do conteúdo
- **Funcionamento**: Indica interesse moderado, o usuário dedicou tempo para consumir o conteúdo

**`like`** (0.5)
- Curtida do conteúdo
- **Funcionamento**: Sinal explícito de aprovação, indica preferência positiva

**`like_comment`** (0.7)
- Curtida de comentário
- **Funcionamento**: Indica aprovação de discussão ou perspectiva específica sobre o conteúdo

**`share`** (0.8)
- Compartilhamento do conteúdo
- **Funcionamento**: Sinal muito forte de valor percebido, indica disposição para recomendar

**`comment`** (0.6)
- Comentário no conteúdo
- **Funcionamento**: Indica engajamento ativo e interesse em discutir o tópico

**`dislike`** (-0.3)
- Descurtida do conteúdo
- **Funcionamento**: Sinal negativo explícito, indica preferência contrária

**`show_less_often`** (-0.5)
- Solicitação para mostrar menos
- **Funcionamento**: Feedback negativo forte, indica que o usuário não quer ver conteúdo similar

**`report`** (-0.8)
- Denúncia do conteúdo
- **Funcionamento**: Sinal negativo muito forte, indica conteúdo inadequado ou ofensivo

#### Learning Rates
Controlam a velocidade de aprendizado para diferentes tipos de entidade e contexto.

**User - `highPriority`** (0.1)
- Taxa de aprendizado para interações de alta prioridade
- **Funcionamento**: Aprendizado rápido para feedback crítico como denúncias ou compartilhamentos

**User - `normal`** (0.05)
- Taxa de aprendizado normal
- **Funcionamento**: Velocidade padrão para a maioria das interações

**Post - `highPriority`** (0.05)
- Taxa para posts com interações importantes
- **Funcionamento**: Ajuste moderado para conteúdo que gera engajamento significativo

**Post - `normal`** (0.02)
- Taxa normal para posts
- **Funcionamento**: Ajuste conservador para manter estabilidade do sistema

**Post - `networkEffect`** (0.005)
- Taxa para efeitos de rede
- **Funcionamento**: Ajuste muito conservador para mudanças que afetam toda a rede

#### Engagement Settings
Define limiares e multiplicadores para diferentes níveis de engajamento.

**`timeThresholds`** (5, 30, 60 segundos)
- Limiares para engajamento curto, médio e longo
- **Funcionamento**: Classifica o nível de interesse baseado no tempo de visualização

**`watchPercentages`** (0.2, 0.8)
- Percentuais baixo e alto de visualização
- **Funcionamento**: Define quando uma visualização é considerada parcial ou completa

**`timeMultipliers`** (0.5, 1.5)
- Multiplicadores para tempo curto e longo
- **Funcionamento**: Ajusta o peso baseado na duração da interação

**`watchMultipliers`** (0.7, 1.3)
- Multiplicadores para visualização parcial e completa
- **Funcionamento**: Recompensa visualizações completas vs. parciais

#### Network Effects
Controla como as interações de outros usuários afetam as recomendações.

**`similarPostsLimit`** (5)
- Limite de posts similares
- **Funcionamento**: Número máximo de posts similares considerados para efeitos de rede

**`similarityThreshold`** (0.8)
- Limiar de similaridade para efeitos de rede
- **Funcionamento**: Score mínimo para considerar posts como similares para efeitos de rede

#### High Priority Interactions
Tipos de interação que recebem tratamento especial devido à sua importância:

- **`like`** - Indica preferência explícita
- **`share`** - Indica valor percebido alto
- **`like_comment`** - Indica aprovação de discussão específica
- **`report`** - Indica conteúdo problemático

### 🎲 candidateSelector

Esta seção controla como candidatos são selecionados para recomendação, balanceando diferentes critérios de qualidade.

#### Weights
Define a importância relativa de diferentes fatores na seleção de candidatos.

**`clusterScore`** (0.4)
- Peso do score do cluster
- **Funcionamento**: Prioriza candidatos de clusters de alta qualidade e relevância

**`recency`** (0.3)
- Peso da recência
- **Funcionamento**: Garante que conteúdo recente seja considerado, evitando recomendações desatualizadas

**`engagement`** (0.2)
- Peso do engajamento
- **Funcionamento**: Considera o potencial de engajamento baseado em padrões históricos

**`random`** (0.1)
- Componente aleatório
- **Funcionamento**: Introduz diversidade e permite descoberta de conteúdo inesperado

#### Thresholds
Define limites e critérios mínimos para seleção de candidatos.

**`minimumClusterScore`** (0.2)
- Score mínimo para considerar um cluster
- **Funcionamento**: Filtra clusters de baixa qualidade, garantindo padrão mínimo

**`timeWindow`** (168 horas = 7 dias)
- Janela de tempo padrão
- **Funcionamento**: Define o período de conteúdo considerado para seleção

**`defaultLimit`** (30)
- Limite padrão de candidatos
- **Funcionamento**: Controla a quantidade de candidatos gerados para processamento posterior

**`bufferSize`** (5)
- Buffer extra por cluster
- **Funcionamento**: Garante que há candidatos suficientes mesmo após filtros posteriores

---

## 🎯 FeedRecommendationParams

Esta seção controla os parâmetros gerais para geração de feeds personalizados, definindo como as recomendações são balanceadas e apresentadas.

**`defaultOptions.limit`** (20)
- Limite de recomendações
- **Funcionamento**: Número de itens retornados por padrão no feed. Balanceia completude com performance

**`defaultOptions.diversity`** (0.4)
- Fator de diversidade
- **Funcionamento**: Controla o quanto o sistema prioriza variedade vs. relevância pura. Valores altos evitam "bolhas de filtro"

**`defaultOptions.novelty`** (0.3)
- Fator de novidade
- **Funcionamento**: Prioriza conteúdo novo e inesperado, mantendo o feed interessante

**`defaultOptions.context.timeOfDay`** (0-23)
- Hora do dia
- **Funcionamento**: Permite ajustes baseados no horário (ex: conteúdo mais leve à noite, mais informativo pela manhã)

**`defaultOptions.context.dayOfWeek`** (0-6)
- Dia da semana
- **Funcionamento**: Permite ajustes baseados no dia (ex: conteúdo mais longo nos fins de semana)

---

## 🏆 RankingParams

Esta seção define como os candidatos são ranqueados e ordenados no feed final, combinando múltiplos fatores para otimizar a experiência do usuário.

### Weights
Define a importância relativa de diferentes componentes no score final de ranking.

**`relevance`** (0.4)
- Relevância do conteúdo para o usuário
- **Funcionamento**: Baseado na similaridade de embedding e histórico de preferências

**`engagement`** (0.25)
- Potencial de engajamento
- **Funcionamento**: Prediz probabilidade de interação baseado em padrões históricos

**`novelty`** (0.15)
- Novidade do conteúdo
- **Funcionamento**: Prioriza conteúdo que o usuário ainda não viu ou é diferente do usual

**`diversity`** (0.1)
- Diversidade da recomendação
- **Funcionamento**: Evita repetição de tópicos ou formatos similares

**`context`** (0.1)
- Contexto temporal e situacional
- **Funcionamento**: Considera hora do dia, dia da semana e contexto atual

### Configurações Gerais
Parâmetros que controlam o comportamento geral do sistema de ranking.

**`noveltyLevel`** (0.3)
- Nível de novidade desejado
- **Funcionamento**: Controla o quanto o sistema deve priorizar conteúdo novo vs. familiar

**`diversityLevel`** (0.4)
- Nível de diversidade desejado
- **Funcionamento**: Define o equilíbrio entre especialização e variedade no feed

**`maxTags`** (10)
- Número máximo de tags para normalização
- **Funcionamento**: Limita o número de tags consideradas para evitar diluição do score

### Decay Settings
- Configurações de decaimento temporal para diferentes tipos de conteúdo
- **Funcionamento**: Conteúdo mais antigo perde relevância gradualmente, mantendo o feed atualizado

### Default Scores
- Scores padrão para cada dimensão de ranking
- **Funcionamento**: Valores de fallback quando não há dados suficientes para cálculo preciso

### Diversity Weights
- Pesos para cálculo de diversidade entre recomendações
- **Funcionamento**: Controla como diferentes aspectos (tópico, criador, formato) contribuem para a diversidade

### Context Weights
- Pesos para cálculo de relevância contextual
- **Funcionamento**: Define a importância de fatores temporais e situacionais no ranking

---

## 🎪 ClusterRankingParams

Esta seção controla como clusters de conteúdo são avaliados e ranqueados, considerando múltiplos fatores de qualidade e relevância.

### Engagement Factors
Fatores que influenciam o cálculo de engajamento esperado para clusters.

**`recency`**
- Influência da recência do conteúdo
- **Funcionamento**: Conteúdo mais recente tende a gerar mais engajamento

**`interactionWeights`**
- Pesos para diferentes tipos de interação
- **Funcionamento**: Define a importância relativa de likes, comentários, compartilhamentos, etc.

**`timeDecayFactor`**
- Fator de decaimento temporal
- **Funcionamento**: Reduz a relevância de clusters antigos

**`maxInteractionsPerUser`**
- Limite máximo de interações por usuário
- **Funcionamento**: Evita que usuários muito ativos dominem as métricas

**`normalizationFactor`**
- Fator de normalização
- **Funcionamento**: Ajusta scores para range consistente

**`defaultInteractionWeights`**
- Pesos padrão para interações
- **Funcionamento**: Valores de fallback quando dados específicos não estão disponíveis

### Novelty Factors
Fatores que controlam a novidade e originalidade dos clusters.

**`viewedContentWeight`**
- Peso para conteúdo já visualizado
- **Funcionamento**: Reduz score de clusters com conteúdo já visto pelo usuário

**`topicNoveltyWeight`**
- Peso para novidade de tópicos
- **Funcionamento**: Recompensa clusters com tópicos novos ou diferentes

**`noveltyDecayPeriodDays`**
- Período de decaimento da novidade
- **Funcionamento**: Define quanto tempo um tópico permanece "novo"

**`similarContentDiscount`**
- Desconto para conteúdo similar
- **Funcionamento**: Reduz score de clusters muito similares a outros já recomendados

### Diversity Factors
Fatores que promovem variedade e diversidade nos clusters recomendados.

**`topicDiversityWeight`**
- Peso para diversidade de tópicos
- **Funcionamento**: Prioriza clusters com tópicos diferentes dos recentemente vistos

**`creatorDiversityWeight`**
- Peso para diversidade de criadores
- **Funcionamento**: Evita concentração excessiva em poucos criadores

**`formatDiversityWeight`**
- Peso para diversidade de formatos
- **Funcionamento**: Garante variedade de tipos de conteúdo (vídeo, texto, imagem, etc.)

**`recentClustersToConsider`**
- Número de clusters recentes a considerar
- **Funcionamento**: Define quantos clusters recentes são usados para calcular diversidade

### Quality Factors
Fatores que avaliam a qualidade intrínseca dos clusters.

**`cohesionWeight`**
- Peso para coesão do cluster
- **Funcionamento**: Recompensa clusters onde os itens são semanticamente relacionados

**`sizeWeight`**
- Peso para tamanho do cluster
- **Funcionamento**: Considera o número de itens no cluster (nem muito pequeno, nem muito grande)

**`densityWeight`**
- Peso para densidade do cluster
- **Funcionamento**: Recompensa clusters com alta similaridade interna

**`stabilityWeight`**
- Peso para estabilidade do cluster
- **Funcionamento**: Prioriza clusters que mantêm consistência ao longo do tempo

**`minOptimalSize`**
- Tamanho mínimo ideal
- **Funcionamento**: Define o menor tamanho aceitável para um cluster

**`maxOptimalSize`**
- Tamanho máximo ideal
- **Funcionamento**: Define o maior tamanho aceitável para um cluster

### User Profile Adjustments
Ajustes baseados no perfil e comportamento específico do usuário.

**`highInteractionThreshold`**
- Limiar para usuários de alta interação
- **Funcionamento**: Identifica usuários muito ativos para ajustes específicos

**`diversityIncrease`**
- Aumento de diversidade para usuários específicos
- **Funcionamento**: Usuários que consomem muito conteúdo recebem mais variedade

**`affinityDecrease`**
- Redução de afinidade para balanceamento
- **Funcionamento**: Evita que usuários fiquem presos em nichos muito específicos

**`noveltyIncrease`**
- Aumento de novidade para usuários específicos
- **Funcionamento**: Usuários experientes recebem mais conteúdo inovador

### Temporal Adjustments
Ajustes baseados no tempo e contexto temporal.

**`nightTime`**
- Ajustes para período noturno
- **Funcionamento**: Conteúdo mais leve e relaxante durante a noite

**`lunchTime`**
- Ajustes para horário de almoço
- **Funcionamento**: Conteúdo mais curto e informativo durante pausas

**`weekend`**
- Ajustes para fins de semana
- **Funcionamento**: Conteúdo mais longo e envolvente nos fins de semana

### Confidence & Statistics
Configurações para cálculo de confiança e coleta de estatísticas.

**`confidence.varianceMultiplier`**
- Multiplicador de variância para confiança
- **Funcionamento**: Ajusta a incerteza baseada na variabilidade dos dados

**`statistics.topClustersCount`**
- Número de clusters top para estatísticas
- **Funcionamento**: Define quantos clusters são monitorados para métricas

**`statistics.scoreDistributionLimits`**
- Limites para distribuição de scores
- **Funcionamento**: Define ranges para análise estatística dos scores

### Fallback Settings
Configurações para casos onde dados insuficientes estão disponíveis.

**`fallback.neutralScore`**
- Score neutro para casos de fallback
- **Funcionamento**: Valor padrão quando não há dados para cálculo preciso

**`fallback.errorConfidence`**
- Confiança para erros
- **Funcionamento**: Nível de confiança atribuído quando ocorrem erros

**`fallback.maxTopicsInMetadata`**
- Máximo de tópicos nos metadados
- **Funcionamento**: Limita o número de tópicos armazenados para eficiência

---

## ⚙️ clusterRankingConfig

Esta seção define a configuração principal para ranqueamento de clusters, combinando múltiplos fatores em um score unificado.

### Base Weights
Pesos fundamentais que definem a importância de cada componente no score final.

**`affinity`** (0.3)
- Afinidade entre usuário e conteúdo
- **Funcionamento**: Baseado na similaridade de embedding e histórico de preferências

**`engagement`** (0.25)
- Potencial de engajamento
- **Funcionamento**: Prediz probabilidade de interação baseado em padrões históricos

**`novelty`** (0.2)
- Novidade do conteúdo
- **Funcionamento**: Prioriza conteúdo que o usuário ainda não viu ou é diferente do usual

**`diversity`** (0.15)
- Diversidade da recomendação
- **Funcionamento**: Evita repetição de tópicos ou formatos similares

**`temporal`** (0.05)
- Relevância temporal
- **Funcionamento**: Considera hora do dia, dia da semana e contexto atual

**`quality`** (0.05)
- Qualidade do cluster
- **Funcionamento**: Avalia coesão, tamanho e estabilidade do cluster

### Affinity Factors
Fatores que calculam a afinidade entre usuário e cluster.

**`embeddingSimilarityWeight`**
- Peso para similaridade de embeddings
- **Funcionamento**: Compara vetores de embedding do usuário e do cluster

**`sharedInterestsWeight`**
- Peso para interesses compartilhados
- **Funcionamento**: Considera tags, categorias e tópicos em comum

**`networkProximityWeight`**
- Peso para proximidade na rede
- **Funcionamento**: Considera conexões sociais e influência de rede

### Engagement Factors
Fatores que predizem o engajamento esperado.

**`recency`**
- Influência da recência
- **Funcionamento**: Conteúdo mais recente tende a gerar mais engajamento

**`interactionWeights`**
- Pesos para diferentes interações
- **Funcionamento**: Define importância de likes, comentários, compartilhamentos

**`timeDecayFactor`**
- Fator de decaimento temporal
- **Funcionamento**: Reduz relevância de clusters antigos

### Novelty Factors
Fatores que controlam a novidade e originalidade.

**`viewedContentWeight`**
- Peso para conteúdo já visualizado
- **Funcionamento**: Reduz score de clusters com conteúdo já visto

**`topicNoveltyWeight`**
- Peso para novidade de tópicos
- **Funcionamento**: Recompensa clusters com tópicos novos

**`noveltyDecayPeriodDays`**
- Período de decaimento da novidade
- **Funcionamento**: Define quanto tempo um tópico permanece "novo"

**`similarContentDiscount`**
- Desconto para conteúdo similar
- **Funcionamento**: Reduz score de clusters muito similares

### Diversity Factors
Fatores que promovem variedade e diversidade.

**`topicDiversityWeight`**
- Peso para diversidade de tópicos
- **Funcionamento**: Prioriza clusters com tópicos diferentes

**`creatorDiversityWeight`**
- Peso para diversidade de criadores
- **Funcionamento**: Evita concentração em poucos criadores

**`formatDiversityWeight`**
- Peso para diversidade de formatos
- **Funcionamento**: Garante variedade de tipos de conteúdo

**`recentClustersToConsider`**
- Número de clusters recentes a considerar
- **Funcionamento**: Define quantos clusters recentes são usados para calcular diversidade

### Temporal Factors
Fatores que consideram o contexto temporal.

**`hourOfDayWeights`**
- Pesos para diferentes horas do dia
- **Funcionamento**: Ajusta relevância baseado no horário

**`dayOfWeekWeights`**
- Pesos para diferentes dias da semana
- **Funcionamento**: Considera padrões semanais de comportamento

**`contentFreshnessWeight`**
- Peso para frescor do conteúdo
- **Funcionamento**: Prioriza conteúdo mais recente

**`temporalEventWeight`**
- Peso para eventos temporais
- **Funcionamento**: Considera eventos especiais e tendências

### Quality Factors
Fatores que avaliam a qualidade intrínseca.

**`cohesionWeight`**
- Peso para coesão do cluster
- **Funcionamento**: Recompensa clusters semanticamente coesos

**`sizeWeight`**
- Peso para tamanho do cluster
- **Funcionamento**: Considera número ideal de itens no cluster

**`densityWeight`**
- Peso para densidade do cluster
- **Funcionamento**: Recompensa clusters com alta similaridade interna

**`stabilityWeight`**
- Peso para estabilidade do cluster
- **Funcionamento**: Prioriza clusters consistentes ao longo do tempo

**`minOptimalSize`**
- Tamanho mínimo ideal
- **Funcionamento**: Define menor tamanho aceitável

**`maxOptimalSize`**
- Tamanho máximo ideal
- **Funcionamento**: Define maior tamanho aceitável

### Diversification
Configurações para diversificação de resultados, evitando repetição excessiva.

**`enabled`** (true)
- Habilita diversificação de resultados
- **Funcionamento**: Ativa algoritmos de diversificação para evitar repetição

**`temperature`** (0.8)
- Temperatura para diversificação
- **Funcionamento**: Controla o nível de aleatoriedade na diversificação

**`method`** ("mmr")
- Método de diversificação (MMR)
- **Funcionamento**: Usa Maximum Marginal Relevance para balancear relevância e diversidade

**`mmrLambda`** (0.5)
- Parâmetro lambda para MMR
- **Funcionamento**: Controla o trade-off entre relevância (λ=1) e diversidade (λ=0)

### Feedback Settings
Configurações para aprendizado em tempo real baseado no feedback do usuário.

**`enabled`** (true)
- Habilita feedback em tempo real
- **Funcionamento**: Permite ajustes dinâmicos baseados no comportamento do usuário

**`positiveAdjustment`** (0.1)
- Ajuste para feedback positivo
- **Funcionamento**: Aumenta score de clusters similares quando usuário interage positivamente

**`negativeAdjustment`** (-0.1)
- Ajuste para feedback negativo
- **Funcionamento**: Reduz score de clusters similares quando usuário interage negativamente

---

## 👥 userTypeConfigs

Esta seção define configurações específicas para diferentes tipos de usuário, permitindo personalização baseada no comportamento e experiência do usuário.

### New User
Configurações para usuários recém-cadastrados que ainda não têm histórico suficiente.

**`weightModifiers`**
- Modificadores de peso para usuários novos
- **Funcionamento**: Ajusta pesos para priorizar conteúdo popular e diverso, já que não há histórico personalizado

### Power User
Configurações para usuários muito ativos com histórico rico de interações.

**`weightModifiers`**
- Modificadores de peso para usuários muito ativos
- **Funcionamento**: Ajusta pesos para priorizar novidade e diversidade, já que o usuário já viu muito conteúdo popular

### Casual User
Configurações para usuários com atividade moderada.

**`weightModifiers`**
- Modificadores de peso para usuários casuais
- **Funcionamento**: Ajusta pesos para balancear conteúdo popular com personalização baseada no histórico limitado

---

## ⏰ temporalDecayConfig

Esta seção define como diferentes tipos de conteúdo perdem relevância ao longo do tempo, implementando decaimento temporal específico para cada categoria.

**`news`** (Half-Life: 6 horas, Max Age: 7 dias)
- Configuração para conteúdo relacionado a notícias/atualidades
- **Funcionamento**: Notícias perdem relevância rapidamente, com meia-vida de 6 horas, mas podem ser relevantes por até uma semana

**`educational`** (Half-Life: 24 horas, Max Age: 30 dias)
- Configuração para conteúdo educacional/informativo
- **Funcionamento**: Conteúdo educacional mantém relevância por mais tempo, com meia-vida de 24 horas e relevância por até um mês

**`entertainment`** (Half-Life: 48 horas, Max Age: 90 dias)
- Configuração para conteúdo de entretenimento
- **Funcionamento**: Entretenimento tem decaimento moderado, com meia-vida de 48 horas e relevância por até 3 meses

**`default`** (Half-Life: 12 horas, Max Age: 14 dias)
- Configuração padrão para outros tipos de conteúdo
- **Funcionamento**: Configuração genérica para conteúdo que não se encaixa nas outras categorias

---

## 📝 Notas Importantes

### Princípios Gerais
- **Todos os valores são configuráveis** e podem ser ajustados conforme as necessidades específicas do sistema
- **Os pesos devem somar 1.0** quando aplicáveis para manter a normalização
- **As configurações de decaimento temporal** são cruciais para manter a relevância do conteúdo
- **O feedback em tempo real** permite ajustes dinâmicos baseados no comportamento do usuário
- **A diversificação** ajuda a evitar "bolhas de filtro" e manter a variedade de conteúdo

### Considerações de Performance
- **Dimensões de embedding** impactam diretamente o tempo de cálculo e armazenamento
- **Tamanhos de lote** devem ser otimizados para o hardware disponível
- **Limiares de similaridade** afetam a quantidade de processamento necessário

### Considerações de Qualidade
- **Taxas de aprendizado** muito altas podem causar instabilidade
- **Pesos de diversidade** muito baixos podem criar "bolhas de filtro"
- **Decaimento temporal** muito agressivo pode perder contexto importante

### Monitoramento Recomendado
- **Taxa de engajamento** por tipo de conteúdo
- **Distribuição de scores** para detectar vieses
- **Diversidade de recomendações** para evitar repetição excessiva
- **Tempo de resposta** para identificar gargalos de performance 

### Pesos de boost de interação
- **clickBoost** 
- **likeBoost**
- **shareBoost**
- **completeViewBoost**
- **likeCommentBoost**
- **reportBoost**
- **showLessOftenBoost**
- **defaultBoost**

### Interaction Score
- **default**
- **defaultWhenBoostZero**