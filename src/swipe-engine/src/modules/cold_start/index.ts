import { connection as db } from "../../../../database/index.js"

interface MomentData {
    id: bigint
    created_at: Date
    visible: boolean
    blocked: boolean
}

async function findRecentMoments(hours: number = 24, limit: number = 100): Promise<MomentData[]> {
    try {
        console.log(`[cold_start] Buscando momentos das últimas ${hours}h com limite de ${limit}`)
        
        // Usando query direta para evitar problemas de inicialização do modelo
        const moments = await db.query(
            `SELECT m.id, m.created_at, m.visible, m.blocked
             FROM moments m
             WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
             AND m.visible = true 
             AND m.blocked = false 
             AND m.deleted = false
             ORDER BY m.created_at DESC
             LIMIT ?`,
            {
                replacements: [hours, limit],
                type: "SELECT",
            }
        ) as MomentData[]

        if (!moments || moments.length === 0) {
            console.log(`[cold_start] Nenhum momento encontrado nas últimas ${hours}h`)
            return []
        }

        console.log(`[cold_start] Encontrados ${moments.length} momentos nas últimas ${hours}h`)
        return moments
    } catch (error) {
        console.error("[cold_start] Erro ao buscar momentos recentes:", error)
        return []
    }
}

async function findFallbackMoments(limit: number = 100): Promise<MomentData[]> {
    try {
        console.log(`[cold_start] Buscando momentos dos últimos 7 dias com limite de ${limit}`)
        
        // Usando query direta para evitar problemas de inicialização do modelo
        const moments = await db.query(
            `SELECT m.id, m.created_at, m.visible, m.blocked
             FROM moments m
             WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             AND m.visible = true 
             AND m.blocked = false 
             AND m.deleted = false
             ORDER BY m.created_at DESC
             LIMIT ?`,
            {
                replacements: [limit],
                type: "SELECT",
            }
        ) as MomentData[]

        if (!moments || moments.length === 0) {
            console.log("[cold_start] Nenhum momento encontrado nos últimos 7 dias")
            return []
        }

        console.log(`[cold_start] Encontrados ${moments.length} momentos nos últimos 7 dias`)
        return moments
    } catch (error) {
        console.error("[cold_start] Erro ao buscar momentos fallback:", error)
        return []
    }
}

export default async function cold_start_algorithm(): Promise<bigint[]> {
    try {
        console.log("[cold_start] Iniciando algoritmo de cold start")
        
        // Tenta buscar momentos das últimas 24 horas
        let candidateMoments = await findRecentMoments(24, 100)

        // Se não encontrou momentos suficientes, tenta buscar dos últimos 7 dias
        if (!candidateMoments || candidateMoments.length < 10) {
            console.log("[cold_start] Poucos momentos nas últimas 24h (< 10), buscando dos últimos 7 dias...")
            candidateMoments = await findFallbackMoments(100)
        }

        // Se ainda não encontrou momentos, retorna array vazio
        if (!candidateMoments || candidateMoments.length === 0) {
            console.log("[cold_start] Nenhum momento encontrado para cold start")
            return []
        }

        // Valida e converte os IDs para BigInt
        const momentIds = candidateMoments
            .filter(moment => {
                const id = moment.id?.toString()
                if (!id || id === "null" || id === "undefined") {
                    console.warn("[cold_start] Momento encontrado sem ID válido:", moment)
                    return false
                }
                return true
            })
            .map(moment => {
                try {
                    const id = moment.id?.toString()
                    if (!id) {
                        console.warn("[cold_start] ID inválido:", moment)
                        return null
                    }
                    return BigInt(id)
                } catch (error) {
                    console.error(`[cold_start] Erro ao converter ID do momento ${moment.id}:`, error)
                    return null
                }
            })
            .filter((id): id is bigint => id !== null)

        if (momentIds.length === 0) {
            console.log("[cold_start] Nenhum ID válido encontrado após conversão")
            return []
        }

        console.log(`[cold_start] Retornando ${momentIds.length} momentos mais recentes:`, 
            momentIds.map(id => id.toString()).join(", "))

        return momentIds
    } catch (error) {
        console.error("[cold_start] Erro crítico no algoritmo:", error)
        return []
    }
}
