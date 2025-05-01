/**
 * Exemplo de uso do sistema de recomendação Circle
 *
 * Este arquivo demonstra como usar as funções do sistema de recomendação
 * em uma aplicação real.
 */

import {
    getRecommendations,
    initializeRecommendationSystem,
    processInteraction,
    processNewPost,
} from "../services"

// Exemplo de função para obter feed de um usuário
async function getUserFeed(userId: string | bigint, limit: number = 20) {
    console.log(`Obtendo feed para usuário ${userId}...`)

    // 1. Inicializar o sistema (isso é feito automaticamente, mas pode ser explícito)
    initializeRecommendationSystem()

    // 2. Configurar opções de recomendação
    const options = {
        limit,
        diversity: 0.4, // 0-1: quanto maior, mais diverso será o feed
        novelty: 0.3, // 0-1: quanto maior, mais conteúdo recente aparecerá
        excludeIds: [], // IDs a serem excluídos (posts já vistos, por exemplo)
        context: {
            timeOfDay: new Date().getHours(), // Hora do dia (0-23)
            dayOfWeek: new Date().getDay(), // Dia da semana (0-6)
            device: "mobile", // Dispositivo usado
        },
    }

    // 3. Obter recomendações
    const recommendations = await getRecommendations(userId, options)

    // 4. Transformar recomendações em formato apropriado para a API
    return recommendations.map((rec) => ({
        id: rec.entityId.toString(),
        type: rec.entityType,
        relevanceScore: rec.score,
        timestamp: rec.timestamp,
    }))
}

// Exemplo de função para registrar interações do usuário
async function logUserInteraction(
    userId: string | bigint,
    momentId: string | bigint,
    action: "like" | "view" | "share" | "comment" | "dislike"
) {
    console.log(`Registrando interação do usuário ${userId} com post ${momentId}: ${action}`)

    // Mapear ação para tipo de interação do sistema
    let interactionType: any
    let metadata: Record<string, any> = {}

    switch (action) {
        case "like":
            interactionType = "like"
            break
        case "view":
            interactionType = "long_view" // Assumindo que é uma visualização completa
            metadata.duration = 15 // Segundos de visualização
            break
        case "share":
            interactionType = "share"
            break
        case "comment":
            interactionType = "comment"
            metadata.commentText = "Comentário do usuário" // Em produção seria o texto real
            break
        case "dislike":
            interactionType = "dislike"
            break
    }

    // Registrar a interação no sistema
    await processInteraction(userId, momentId, "post", interactionType, metadata)

    return { success: true, message: "Interação registrada com sucesso" }
}

// Exemplo de função para processar um novo post
async function handleNewPost(momentId: string | bigint, userId: string | bigint) {
    console.log(`Processando novo post ${momentId} do usuário ${userId}...`)

    // 1. Processar o post no sistema de recomendação
    await processNewPost(momentId)

    return { success: true, message: "Post processado com sucesso" }
}

// Exemplo de uso em um controlador de API
export async function apiExampleController(req: any, res: any) {
    try {
        const { action, userId, momentId } = req.body

        switch (action) {
            case "getFeed":
                const feed = await getUserFeed(userId, 10)
                return res.json({ feed })

            case "interaction":
                const result = await logUserInteraction(userId, momentId, req.body.interactionType)
                return res.json(result)

            case "newPost":
                const postResult = await handleNewPost(momentId, userId)
                return res.json(postResult)

            default:
                return res.status(400).json({ error: "Ação inválida" })
        }
    } catch (error: any) {
        console.error("Erro no controlador:", error)
        return res.status(500).json({ error: error.message })
    }
}
