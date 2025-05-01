/**
 * Inicialização do Sistema de Recomendação Swipe Engine v2
 *
 * Este arquivo é responsável por inicializar o sistema de recomendação
 * durante a inicialização do aplicativo.
 */

import { initializeRecommendationSystem } from "./services"

/**
 * Inicializa o sistema de recomendação
 */
export function initSwipeEngineV2() {
    console.log("Inicializando Swipe Engine V2...")
    try {
        // Inicializa o sistema de recomendação
        initializeRecommendationSystem()
        console.log("✅ Swipe Engine V2 inicializado com sucesso")
    } catch (error) {
        console.error("❌ Erro ao inicializar Swipe Engine V2:", error)
    }
}
