/**
 * Exemplo de uso do ClusterRankingAlgorithm
 * 
 * Este arquivo demonstra como usar o algoritmo de ranqueamento
 * que aplica todas as métricas: Affinity, Diversity, Engagement,
 * Novelty, Temporal e Quality.
 */

import { ClusterInfo, EmbeddingVector, RecommendationContext, UserEmbedding, UserProfile } from "../../types"
import {
    processCommentLikeInteraction,
    processSaveInteraction,
    processViewInteraction
} from "../metrics/EngagementMetrics"

import { ClusterRankingAlgorithm } from "../ClusterRankingAlgorithm"

// Função auxiliar para criar EmbeddingVector
function createEmbeddingVector(values: number[]): EmbeddingVector {
    return {
        dimension: values.length,
        values,
        createdAt: new Date(),
        updatedAt: new Date()
    }
}

/**
 * Exemplo de uso básico do algoritmo de ranqueamento
 */
export async function exemploBasicoRanking() {
    console.log("=== EXEMPLO BÁSICO DE RANQUEAMENTO ===")
    
    // 1. Criar instância do algoritmo
    const rankingAlgorithm = new ClusterRankingAlgorithm()
    
    // 2. Preparar dados de exemplo
    const clusters: ClusterInfo[] = [
        {
            id: "cluster-1",
            name: "Tecnologia e Programação",
            centroid: createEmbeddingVector([0.8, 0.2, 0.1, 0.3, 0.9]),
            size: 150,
            topics: ["programação", "javascript", "react", "desenvolvimento", "tecnologia"],
            density: 0.7
        },
        {
            id: "cluster-2", 
            name: "Esportes e Fitness",
            centroid: createEmbeddingVector([0.1, 0.9, 0.2, 0.8, 0.1]),
            size: 200,
            topics: ["futebol", "fitness", "esportes", "saúde", "treino"],
            density: 0.6
        },
        {
            id: "cluster-3",
            name: "Música e Entretenimento", 
            centroid: createEmbeddingVector([0.3, 0.1, 0.9, 0.2, 0.4]),
            size: 120,
            topics: ["música", "rock", "festival", "show", "entretenimento"],
            density: 0.8
        }
    ]
    
    // 3. Preparar embedding do usuário
    const userEmbedding: UserEmbedding = {
        userId: "user-123",
        vector: createEmbeddingVector([0.7, 0.3, 0.2, 0.4, 0.8]) // Interesse em tecnologia
    }
    
    // 4. Preparar perfil do usuário
    const userProfile: UserProfile = {
        userId: "user-123",
        interests: ["programação", "javascript", "tecnologia", "inovação"],
        interactions: [
            {
                postIds: ["post-1", "post-2"],
                type: "like",
                timestamp: new Date(Date.now() - 3600000) // 1 hora atrás
            },
            {
                postIds: ["post-3"],
                type: "share", 
                timestamp: new Date(Date.now() - 7200000) // 2 horas atrás
            }
        ]
    }
    
    // 5. Preparar contexto da recomendação
    const context: RecommendationContext = {
        timeOfDay: 14, // 14:00 (tarde)
        dayOfWeek: 2,  // Terça-feira
        location: "São Paulo"
    }
    
    // 6. Executar ranqueamento
    const resultados = rankingAlgorithm.rankClusters(
        clusters,
        userEmbedding,
        userProfile,
        context
    )
    
    // 7. Exibir resultados
    console.log("\n📊 RESULTADOS DO RANQUEAMENTO:")
    console.log("=".repeat(50))
    
    resultados.forEach((resultado, index) => {
        console.log(`\n🏆 #${index + 1} - Cluster: ${resultado.metadata.clusterName}`)
        console.log(`   ID: ${resultado.clusterId}`)
        console.log(`   Score Final: ${resultado.score.toFixed(3)}`)
        console.log(`   Confiança: ${resultado.confidence.toFixed(3)}`)
        console.log(`   Tamanho: ${resultado.metadata.clusterSize} membros`)
        
        console.log("\n   📈 Scores por Componente:")
        console.log(`   • Afinidade: ${resultado.componentScores.affinity.toFixed(3)}`)
        console.log(`   • Engajamento: ${resultado.componentScores.engagement.toFixed(3)}`)
        console.log(`   • Novidade: ${resultado.componentScores.novelty.toFixed(3)}`)
        console.log(`   • Diversidade: ${resultado.componentScores.diversity.toFixed(3)}`)
        console.log(`   • Temporal: ${resultado.componentScores.temporal.toFixed(3)}`)
        console.log(`   • Qualidade: ${resultado.componentScores.quality.toFixed(3)}`)
        
        if (resultado.metadata.clusterTopics) {
            console.log(`   • Tópicos: ${resultado.metadata.clusterTopics.join(", ")}`)
        }
    })
    
    // 8. Obter estatísticas do ranqueamento
    const stats = rankingAlgorithm.getRankingStats(resultados)
    console.log("\n📊 ESTATÍSTICAS DO RANQUEAMENTO:")
    console.log("=".repeat(40))
    console.log(`Total de clusters: ${stats.totalClusters}`)
    console.log(`Score médio: ${stats.averageScore.toFixed(3)}`)
    console.log(`Top clusters: ${stats.topClusters.join(", ")}`)
    console.log(`Confiança média: ${stats.confidenceStats.average.toFixed(3)}`)
    
    console.log("\nDistribuição de scores:")
    Object.entries(stats.scoreDistribution).forEach(([range, count]) => {
        console.log(`  ${range}: ${count} clusters`)
    })
}

/**
 * Exemplo de ranqueamento com diferentes contextos
 */
export async function exemploContextosDiferentes() {
    console.log("\n=== EXEMPLO COM DIFERENTES CONTEXTOS ===")
    
    const rankingAlgorithm = new ClusterRankingAlgorithm()
    
    // Mesmos clusters do exemplo anterior
    const clusters: ClusterInfo[] = [
        {
            id: "cluster-1",
            name: "Tecnologia e Programação",
            centroid: createEmbeddingVector([0.8, 0.2, 0.1, 0.3, 0.9]),
            size: 150,
            topics: ["programação", "javascript", "react", "desenvolvimento", "tecnologia"],
            density: 0.7
        },
        {
            id: "cluster-2",
            name: "Esportes e Fitness", 
            centroid: createEmbeddingVector([0.1, 0.9, 0.2, 0.8, 0.1]),
            size: 200,
            topics: ["futebol", "fitness", "esportes", "saúde", "treino"],
            density: 0.6
        }
    ]
    
    const userEmbedding: UserEmbedding = {
        userId: "user-123",
        vector: createEmbeddingVector([0.5, 0.5, 0.3, 0.4, 0.6]) // Interesses balanceados
    }
    
    // Contexto 1: Manhã de segunda-feira (trabalho)
    const contextoManha = {
        timeOfDay: 9,
        dayOfWeek: 1, // Segunda-feira
        location: "São Paulo"
    }
    
    // Contexto 2: Noite de sexta-feira (lazer)
    const contextoNoite = {
        timeOfDay: 20,
        dayOfWeek: 5, // Sexta-feira
        location: "São Paulo"
    }
    
    console.log("\n🌅 Contexto: Manhã de Segunda-feira (Trabalho)")
    const resultadosManha = rankingAlgorithm.rankClusters(clusters, userEmbedding, null, contextoManha)
    resultadosManha.forEach((r, i) => {
        console.log(`${i + 1}. ${r.metadata.clusterName} - Score: ${r.score.toFixed(3)}`)
    })
    
    console.log("\n🌙 Contexto: Noite de Sexta-feira (Lazer)")
    const resultadosNoite = rankingAlgorithm.rankClusters(clusters, userEmbedding, null, contextoNoite)
    resultadosNoite.forEach((r, i) => {
        console.log(`${i + 1}. ${r.metadata.clusterName} - Score: ${r.score.toFixed(3)}`)
    })
}

/**
 * Exemplo de análise detalhada de um cluster específico
 */
export async function exemploAnaliseDetalhada() {
    console.log("\n=== ANÁLISE DETALHADA DE CLUSTER ===")
    
    const rankingAlgorithm = new ClusterRankingAlgorithm()
    
    const cluster: ClusterInfo = {
        id: "cluster-tech",
        name: "Tecnologia Avançada",
        centroid: createEmbeddingVector([0.9, 0.1, 0.2, 0.8, 0.7]),
        size: 300,
        topics: ["IA", "machine-learning", "python", "data-science", "inovação"],
        density: 0.8
    }
    
    const userEmbedding: UserEmbedding = {
        userId: "user-tech",
        vector: createEmbeddingVector([0.8, 0.2, 0.3, 0.7, 0.6])
    }
    
    const userProfile: UserProfile = {
        userId: "user-tech",
        interests: ["programação", "python", "IA", "tecnologia"],
        interactions: [
            {
                postIds: ["post-ai-1", "post-ai-2"],
                type: "like",
                timestamp: new Date(Date.now() - 1800000) // 30 min atrás
            }
        ]
    }
    
    const context: RecommendationContext = {
        timeOfDay: 10,
        dayOfWeek: 3, // Quarta-feira
        location: "São Paulo"
    }
    
    const resultados = rankingAlgorithm.rankClusters([cluster], userEmbedding, userProfile, context)
    
    if (resultados.length > 0) {
        const resultado = resultados[0]
        
        console.log(`\n🔍 ANÁLISE DETALHADA: ${resultado.metadata.clusterName}`)
        console.log("=".repeat(50))
        
        console.log(`\n📊 Score Final: ${resultado.score.toFixed(3)}`)
        console.log(`🎯 Confiança: ${resultado.confidence.toFixed(3)}`)
        
        console.log("\n📈 Análise por Componente:")
        
        const scores = resultado.componentScores
        const interpretacoes = {
            affinity: scores.affinity > 0.7 ? "Alta afinidade" : scores.affinity > 0.4 ? "Afinidade moderada" : "Baixa afinidade",
            engagement: scores.engagement > 0.7 ? "Alto engajamento" : scores.engagement > 0.4 ? "Engajamento moderado" : "Baixo engajamento",
            novelty: scores.novelty > 0.7 ? "Alta novidade" : scores.novelty > 0.4 ? "Novidade moderada" : "Baixa novidade",
            diversity: scores.diversity > 0.7 ? "Alta diversidade" : scores.diversity > 0.4 ? "Diversidade moderada" : "Baixa diversidade",
            temporal: scores.temporal > 0.7 ? "Alta relevância temporal" : scores.temporal > 0.4 ? "Relevância temporal moderada" : "Baixa relevância temporal",
            quality: scores.quality > 0.7 ? "Alta qualidade" : scores.quality > 0.4 ? "Qualidade moderada" : "Baixa qualidade"
        }
        
        Object.entries(scores).forEach(([componente, score]) => {
            console.log(`   • ${componente.charAt(0).toUpperCase() + componente.slice(1)}: ${score.toFixed(3)} (${interpretacoes[componente as keyof typeof interpretacoes]})`)
        })
        
        console.log(`\n🏷️  Tópicos: ${resultado.metadata.clusterTopics?.join(", ")}`)
        console.log(`👥 Tamanho: ${resultado.metadata.clusterSize} membros`)
        
        // Recomendação baseada no score
        if (resultado.score > 0.7) {
            console.log("\n✅ RECOMENDAÇÃO: Fortemente recomendado!")
        } else if (resultado.score > 0.5) {
            console.log("\n👍 RECOMENDAÇÃO: Moderadamente recomendado")
        } else {
            console.log("\n⚠️  RECOMENDAÇÃO: Pouco recomendado")
        }
    }
}

// Exemplo de uso das novas ações de interação
function demonstrateNewInteractionTypes() {
    console.log("\n=== Demonstração das Novas Ações de Interação ===")
    
    // 1. Visualização parcial (usuário viu pouco do conteúdo)
    const partialViewInteraction = {
        id: "interaction-1",
        userId: BigInt("123"),
        entityId: BigInt("post-456"),
        entityType: "post" as const,
        type: "view" as any, // Será processado
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        metadata: {}
    }
    
    const processedPartialView = processViewInteraction(
        partialViewInteraction,
        15, // 15 segundos de visualização
        0.3 // 30% do conteúdo visto
    )
    
    console.log("Visualização parcial:", {
        tipo: processedPartialView.type,
        duracao: processedPartialView.metadata?.durationSeconds,
        percentual: processedPartialView.metadata?.watchPercentage,
        peso: "0.5 (sinal fraco)"
    })
    
    // 2. Visualização completa (usuário viu a maior parte do conteúdo)
    const completeViewInteraction = {
        id: "interaction-2",
        userId: BigInt("123"),
        entityId: BigInt("post-789"),
        entityType: "post" as const,
        type: "view" as any, // Será processado
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
        metadata: {}
    }
    
    const processedCompleteView = processViewInteraction(
        completeViewInteraction,
        45, // 45 segundos de visualização
        0.9 // 90% do conteúdo visto
    )
    
    console.log("Visualização completa:", {
        tipo: processedCompleteView.type,
        duracao: processedCompleteView.metadata?.durationSeconds,
        percentual: processedCompleteView.metadata?.watchPercentage,
        peso: "1.0 (sinal moderado)"
    })
    
    // 3. Like em comentário (usuário curtiu um comentário específico)
    const commentLikeInteraction = {
        id: "interaction-3",
        userId: BigInt("123"),
        entityId: BigInt("post-101"),
        entityType: "post" as const,
        type: "like" as any, // Será processado
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
        metadata: {}
    }
    
    const processedCommentLike = processCommentLikeInteraction(
        commentLikeInteraction,
        "comment-202" // ID do comentário curtido
    )
    
    console.log("Like em comentário:", {
        tipo: processedCommentLike.type,
        comentarioId: processedCommentLike.metadata?.commentId,
        peso: "2.5 (sinal forte de engajamento profundo)"
    })
    
    // 4. Salvamento (usuário salvou o conteúdo para ver depois)
    const saveInteraction = {
        id: "interaction-4",
        userId: BigInt("123"),
        entityId: BigInt("post-303"),
        entityType: "post" as const,
        type: "like" as any, // Será processado
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
        metadata: {}
    }
    
    const processedSave = processSaveInteraction(
        saveInteraction,
        "interessante" // Motivo do salvamento
    )
    
    console.log("Salvamento:", {
        tipo: processedSave.type,
        motivo: processedSave.metadata?.saveReason,
        peso: "3.5 (sinal forte de intenção de revisitar)"
    })
    
    // 5. Comparação de pesos das diferentes ações
    console.log("\nComparação de pesos das ações:")
    console.log("- Visualização parcial (view_parcial): 0.5")
    console.log("- Visualização completa (view_completa): 1.0")
    console.log("- Like: 2.0")
    console.log("- Like em comentário (like_comment): 2.5")
    console.log("- Comentário: 3.0")
    console.log("- Salvamento (save): 3.5")
    console.log("- Compartilhamento (share): 4.0")
    
    // 6. Comparação de meias-vidas
    console.log("\nComparação de meias-vidas (tempo para peso cair pela metade):")
    console.log("- Visualização parcial: 24 horas")
    console.log("- Visualização completa: 48 horas")
    console.log("- Like: 168 horas (7 dias)")
    console.log("- Like em comentário: 192 horas (8 dias)")
    console.log("- Comentário: 336 horas (14 dias)")
    console.log("- Compartilhamento: 336 horas (14 dias)")
    console.log("- Salvamento: 720 horas (30 dias)")
}

// Executar exemplos
export async function executarExemplos() {
    try {
        await exemploBasicoRanking()
        await exemploContextosDiferentes()
        await exemploAnaliseDetalhada()
        
        console.log("\n🎉 Todos os exemplos executados com sucesso!")
    } catch (error) {
        console.error("❌ Erro ao executar exemplos:", error)
    }
}

// Executar demonstração
demonstrateNewInteractionTypes() 