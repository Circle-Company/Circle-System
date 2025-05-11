export const EmbeddingParams = {
    // Configurações de tempo
    timeWindows: {
        /**
         * Tempo máximo desde a última atualização do embedding (24 horas)
         * - Define após quanto tempo um embedding é considerado desatualizado
         * - Controla a frequência de atualização dos embeddings dos usuários
         * - Equilibra precisão vs. custo computacional
         */
        recentEmbeddingUpdate: 24 * 60 * 60 * 1000, // 24 horas

        /**
         * Período de histórico de interações considerado (30 dias)
         * - Define o período de interações que influenciam o embedding
         * - Interações mais antigas que este período têm menor impacto
         * - Ajuda a manter o embedding atualizado com os interesses recentes
         */
        interactionHistory: 30 * 24 * 60 * 60 * 1000, // 30 dias
    },

    // Configurações de dimensões
    dimensions: {
        /**
         * Dimensão total do vetor de embedding (128)
         * - Define o tamanho do vetor de embedding final
         * - Valores maiores capturam mais nuances e características
         * - Valores menores reduzem o custo computacional
         * - Balanceia riqueza de representação vs. performance
         */
        embedding: 128,

        /**
         * Dimensões dedicadas ao histórico de interações (50)
         * - Parte do vetor que representa padrões de interação
         * - Captura preferências implícitas através do comportamento
         */
        interactionHistory: 50,

        /**
         * Dimensões dedicadas às preferências de conteúdo (20)
         * - Parte do vetor que representa preferências explícitas
         * - Captura tópicos, categorias e temas de interesse
         */
        contentPreferences: 20,

        /**
         * Dimensões dedicadas a características sociais (30)
         * - Parte do vetor que representa conexões e dinâmicas sociais
         * - Captura influência de rede, comunidades e grupos
         */
        socialFeatures: 30,
    },

    // Pesos para componentes do embedding
    weights: {
        content: {
            /**
             * Peso do texto no embedding de conteúdo (0.5)
             * - Importância do conteúdo textual na geração do embedding
             * - Valores mais altos priorizam a semântica textual
             * - Principal componente para capturar o significado do conteúdo
             */
            text: 0.5,

            /**
             * Peso das tags no embedding de conteúdo (0.3)
             * - Importância de categorias e tags na geração do embedding
             * - Valores mais altos priorizam a categorização explícita
             * - Ajuda a conectar conteúdo semanticamente relacionado
             */
            tags: 0.3,

            /**
             * Peso do engajamento no embedding de conteúdo (0.2)
             * - Importância das métricas de engajamento na geração do embedding
             * - Valores mais altos priorizam conteúdo popular
             * - Incorpora feedback coletivo no modelo de representação
             */
            engagement: 0.2,
        },
        interactions: {
            /**
             * Peso de uma visualização (0.1)
             * - Impacto de uma visualização no embedding do usuário
             * - Sinal mais fraco, indica interesse potencial
             */
            view: 0.1,

            /**
             * Peso de um like (0.3)
             * - Impacto de um like no embedding do usuário
             * - Sinal moderado, indica apreciação do conteúdo
             */
            like: 0.3,

            /**
             * Peso de um comentário (0.5)
             * - Impacto de um comentário no embedding do usuário
             * - Sinal forte, indica engajamento ativo
             */
            comment: 0.5,

            /**
             * Peso de um compartilhamento (0.7)
             * - Impacto de um compartilhamento no embedding do usuário
             * - Sinal muito forte, indica endosso do conteúdo
             */
            share: 0.7,

            /**
             * Peso de um salvamento (0.6)
             * - Impacto de salvar o conteúdo no embedding do usuário
             * - Sinal forte, indica intenção de revisitar
             */
            save: 0.6,

            /**
             * Peso padrão para interações não especificadas (0.2)
             * - Usado quando o tipo de interação não tem peso definido
             * - Garante que todas as interações tenham algum impacto
             */
            default: 0.2,
        },
        update: {
            /**
             * Taxa de atualização padrão para embeddings (0.5)
             * - Controla o quanto novas interações alteram o embedding existente
             * - Valores mais altos fazem o modelo se adaptar mais rapidamente
             * - Valores mais baixos preservam mais o histórico de longo prazo
             * - Balanceia adaptabilidade vs. estabilidade do modelo
             */
            default: 0.5,
        },
    },

    // Configurações de similaridade
    similarity: {
        /**
         * Limite padrão para resultados de similaridade (10)
         * - Número de itens semelhantes a retornar por padrão
         * - Controla o volume de processamento e resultados
         */
        defaultLimit: 10,

        /**
         * Limiar mínimo de similaridade (0.7)
         * - Score mínimo para considerar dois itens como similares
         * - Itens com similaridade abaixo deste valor são ignorados
         * - Valores mais altos exigem maior precisão na correspondência
         * - Valores mais baixos permitem resultados mais diversos
         */
        minimumThreshold: 0.7,
    },

    // Configurações de processamento em lote
    batchProcessing: {
        /**
         * Tamanho do lote para processamento (100)
         * - Número de itens processados em cada lote
         * - Equilibra uso de memória vs. eficiência de processamento
         * - Valores maiores aumentam eficiência, mas consomem mais recursos
         */
        size: 100,
    },

    // Configurações de normalização
    normalization: {
        /**
         * Base logarítmica para normalização de engajamento (10)
         * - Usada para suavizar valores de engajamento com grande variação
         * - Comprime valores extremos (ex: posts virais) para escala mais gerenciável
         * - Reduz o impacto desproporcional de outliers
         */
        engagementLogBase: 10,

        /**
         * Fator de escala para engajamento (5)
         * - Multiplicador aplicado após normalização logarítmica
         * - Ajusta a magnitude do impacto do engajamento
         * - Controla o peso relativo do engajamento vs. outros fatores
         */
        engagementScaleFactor: 5,
    },

    // Configurações de decaimento
    decay: {
        interactionWeight: {
            /**
             * Taxa de decaimento base para interações (24 horas)
             * - Define o período base para decaimento de relevância das interações
             * - Interações mais antigas têm seu peso reduzido progressivamente
             * - Valores menores fazem o sistema se adaptar mais rapidamente
             */
            base: 24, // horas

            /**
             * Peso mínimo após decaimento (0.1)
             * - Valor mínimo que uma interação pode atingir após decaimento
             * - Garante que interações históricas ainda mantenham alguma influência
             * - Preserva a memória de longo prazo do sistema
             */
            minimum: 0.1,
        },
    },

    // Configurações de feedback e processamento de interações
    feedback: {
        // Forças de interação
        interactionStrengths: {
            /**
             * Visualização curta (0.1)
             * - Impacto de visualizações breves no modelo
             * - Sinal fraco, pode indicar desinteresse ou visualização acidental
             */
            short_view: 0.1,

            /**
             * Visualização longa (0.3)
             * - Impacto de visualizações prolongadas no modelo
             * - Sinal moderado, indica engajamento e interesse
             */
            long_view: 0.3,

            /**
             * Like (0.5)
             * - Impacto de um like no modelo
             * - Sinal positivo claro, indica apreciação explícita
             */
            like: 0.5,

            /**
             * Like em um comentário (0.6)
             * - Impacto de gostar de um comentário no modelo
             * - Sinal forte, indica engajamento mais profundo com a discussão
             */
            like_comment: 0.6,

            /**
             * Compartilhamento (0.8)
             * - Impacto de compartilhar conteúdo no modelo
             * - Sinal muito forte, indica forte endosso e valor percebido
             */
            share: 0.8,

            /**
             * Comentário (0.4)
             * - Impacto de comentar no modelo
             * - Sinal moderado-forte, indica engajamento ativo
             * - Pode ser positivo ou negativo dependendo do conteúdo
             */
            comment: 0.4,

            /**
             * Dislike (rejeição) (-0.5)
             * - Impacto negativo no modelo
             * - Sinal claro de desinteresse ou desaprovação
             * - Valor negativo para reduzir recomendações similares
             */
            dislike: -0.5,

            /**
             * Mostrar menos frequentemente (-0.6)
             * - Impacto negativo mais forte no modelo
             * - Sinal explícito de desinteresse contínuo
             * - Reduz significativamente conteúdo similar
             */
            show_less_often: -0.6,

            /**
             * Denúncia (-0.8)
             * - Impacto negativo muito forte no modelo
             * - Sinal de rejeição completa do conteúdo
             * - Evita fortemente conteúdo similar
             */
            report: -0.8,
        },

        // Taxas de aprendizado
        learningRates: {
            user: {
                /**
                 * Taxa de aprendizado para interações de alta prioridade (0.1)
                 * - Velocidade de adaptação para feedbacks importantes
                 * - Valores mais altos causam mudanças mais rápidas no modelo
                 * - Usado para interações explícitas e significativas
                 */
                highPriority: 0.1,

                /**
                 * Taxa de aprendizado normal (0.05)
                 * - Velocidade de adaptação para atualizações em lote
                 * - Mais conservadora para evitar mudanças bruscas
                 * - Mantém estabilidade no modelo durante atualizações frequentes
                 */
                normal: 0.05,
            },
            post: {
                /**
                 * Taxa para posts com interações importantes (0.05)
                 * - Velocidade de adaptação para posts com feedback significativo
                 * - Atualiza mais rapidamente representações de conteúdo popular
                 */
                highPriority: 0.05,

                /**
                 * Taxa normal para posts (0.02)
                 * - Velocidade de adaptação para atualizações em lote
                 * - Mais conservadora para manter estabilidade do modelo
                 */
                normal: 0.02,

                /**
                 * Taxa para efeitos de rede (0.005)
                 * - Velocidade de adaptação para influências indiretas
                 * - Muito conservadora para propagar mudanças na rede
                 * - Evita amplificação excessiva de tendências temporárias
                 */
                networkEffect: 0.005,
            },
        },

        // Configurações de engajamento
        engagement: {
            timeThresholds: {
                /**
                 * Limiar para engajamento curto (5 segundos)
                 * - Define o que é considerado uma visualização breve
                 * - Abaixo deste valor, a interação tem peso reduzido
                 */
                short: 5,

                /**
                 * Limiar para engajamento médio (30 segundos)
                 * - Define uma interação de duração moderada
                 * - Base para calcular o multiplicador de tempo
                 */
                medium: 30,

                /**
                 * Limiar para engajamento longo (60 segundos)
                 * - Define o que é considerado uma visualização prolongada
                 * - Acima deste valor, a interação tem peso aumentado
                 */
                long: 60,
            },
            watchPercentages: {
                /**
                 * Percentual baixo de visualização (20%)
                 * - Define visualização parcial/superficial
                 * - Abaixo deste valor, o engajamento tem peso reduzido
                 */
                low: 0.2,

                /**
                 * Percentual alto de visualização (80%)
                 * - Define visualização completa/profunda
                 * - Acima deste valor, o engajamento tem peso aumentado
                 */
                high: 0.8,
            },
            timeMultipliers: {
                /**
                 * Multiplicador para tempo curto (0.5)
                 * - Reduz o impacto de interações breves
                 * - Aplica-se quando o tempo está abaixo do limiar curto
                 */
                short: 0.5,

                /**
                 * Multiplicador para tempo longo (1.5)
                 * - Aumenta o impacto de interações prolongadas
                 * - Aplica-se quando o tempo está acima do limiar longo
                 */
                long: 1.5,
            },
            watchMultipliers: {
                /**
                 * Multiplicador para visualização parcial (0.7)
                 * - Reduz o impacto quando pouco do conteúdo foi visto
                 * - Aplica-se quando o percentual está abaixo do limiar baixo
                 */
                low: 0.7,

                /**
                 * Multiplicador para visualização completa (1.3)
                 * - Aumenta o impacto quando a maior parte do conteúdo foi vista
                 * - Aplica-se quando o percentual está acima do limiar alto
                 */
                high: 1.3,
            },
        },

        // Configurações de efeitos de rede
        networkEffects: {
            /**
             * Limite de posts similares (5)
             * - Número máximo de posts similares afetados por uma interação
             * - Controla a propagação de feedback na rede de conteúdo
             * - Limita o alcance de efeitos em cascata
             */
            similarPostsLimit: 5,

            /**
             * Limiar de similaridade para efeitos de rede (0.8)
             * - Similaridade mínima para propagar efeitos entre posts
             * - Valor alto para garantir que apenas conteúdo muito similar seja afetado
             * - Evita contaminação entre domínios de conteúdo diferentes
             */
            similarityThreshold: 0.8,
        },

        // Tipos de interação de alta prioridade
        highPriorityInteractions: [
            "like",
            "share",
            "like_comment",
            "report",
        ],
    },

    // Configurações do CandidateSelector
    candidateSelector: {
        weights: {
            /**
             * Peso do score do cluster (0.4)
             * - Determina o quanto o score de similaridade do cluster influencia na seleção
             * - Valores mais altos priorizam candidatos de clusters mais similares ao usuário
             * - Valores mais baixos permitem mais diversidade entre clusters
             */
            clusterScore: 0.4,

            /**
             * Peso da recência (0.3)
             * - Controla o quanto a data de criação do post influencia na seleção
             * - Valores mais altos priorizam conteúdo mais recente
             * - Valores mais baixos permitem que conteúdo mais antigo tenha mais chance
             * - Ajuda a balancear conteúdo novo vs. conteúdo relevante
             */
            recency: 0.3,

            /**
             * Peso do engajamento (0.2)
             * - Define o impacto das métricas de engajamento (likes, comentários, shares)
             * - Valores mais altos priorizam conteúdo com mais interações
             * - Valores mais baixos dão mais chance para conteúdo menos engajado
             * - Ajuda a identificar conteúdo de qualidade através do engajamento da comunidade
             */
            engagement: 0.2,

            /**
             * Componente aleatório (0.1)
             * - Adiciona um fator de aleatoriedade na seleção
             * - Ajuda a evitar bolhas de filtro e introduz diversidade
             * - Valores mais altos aumentam a exploração de conteúdo diverso
             * - Valores mais baixos mantêm o foco em conteúdo mais relevante
             * - Importante para descoberta de novo conteúdo e evitar viés
             */
            random: 0.1,
        },
        thresholds: {
            /**
             * Score mínimo para considerar um cluster (0.2)
             * - Define o limiar de similaridade para incluir um cluster na seleção
             * - Clusters com score abaixo deste valor são ignorados
             * - Ajuda a filtrar clusters pouco relevantes
             */
            minimumClusterScore: 0.2,

            /**
             * Janela de tempo padrão (168 horas = 7 dias)
             * - Define o período máximo de idade do conteúdo em horas
             * - Conteúdo mais antigo que este limite é ignorado
             * - Ajuda a manter o feed atualizado e relevante
             */
            timeWindow: 24 * 7,

            /**
             * Limite padrão de candidatos (30)
             * - Número máximo de candidatos retornados por chamada
             * - Ajuda a controlar o volume de processamento
             * - Balanceia entre diversidade e performance
             */
            defaultLimit: 30,

            /**
             * Buffer extra por cluster (5)
             * - Número adicional de candidatos buscados por cluster
             * - Compensa possíveis filtros posteriores (ex: duplicatas, conteúdo excluído)
             * - Garante que teremos candidatos suficientes mesmo após filtros
             */
            bufferSize: 5,
        }
    },
}

export const FeedRecommendationParams = {
         /**
         * Configurações padrão para o feed de momentos
         * - Define os parâmetros de recomendação usados no feed principal
         * - Controla o balanceamento entre relevância, diversidade e novidade
         */
        defaultOptions: {
            /**
             * Limite de recomendações (20)
             * - Número de itens recomendados por chamada
             * - Balanceia entre completude do feed e performance
             * - Valor maior aumenta a diversidade, mas pode impactar a performance
             */
            limit: 20,

            /**
             * Fator de diversidade (0.4)
             * - Controla o quanto o sistema prioriza conteúdo diverso
             * - Valores mais altos (próximos de 1) aumentam a variedade de conteúdo
             * - Valores mais baixos mantêm o foco em conteúdo mais similar
             * - Ajuda a evitar bolhas de filtro e introduz descobertas
             */
            diversity: 0.4,

            /**
             * Fator de novidade (0.3)
             * - Controla o quanto o sistema prioriza conteúdo recente
             * - Valores mais altos dão mais peso a conteúdo novo
             * - Valores mais baixos permitem que conteúdo mais antigo tenha mais chance
             * - Ajuda a manter o feed atualizado e dinâmico
             */
            novelty: 0.3,

            /**
             * Contexto da recomendação
             * - Informações adicionais que influenciam as recomendações
             * - Ajuda a personalizar o feed baseado em fatores temporais
             */
            context: {
                /**
                 * Hora do dia (0-23)
                 * - Usado para ajustar recomendações baseado no horário
                 * - Permite recomendações diferentes para manhã/tarde/noite
                 * - Ajuda a capturar padrões de consumo por período
                 */
                timeOfDay: true,

                /**
                 * Dia da semana (0-6)
                 * - Usado para ajustar recomendações baseado no dia
                 * - Permite recomendações diferentes para dias úteis/fins de semana
                 * - Ajuda a capturar padrões de consumo por dia
                 */
                dayOfWeek: true,
            },
        }
}