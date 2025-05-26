import * as fs from "fs"
import * as path from "path"

import { FeatureExtractionPipeline, pipeline } from "@xenova/transformers"

import { getLogger } from "./core/utils/logger"
import { initializeRecommendationSystem } from "./services"
import { testMockRecommendation } from "./tests/test-mock-recommendation"
import { testPostClustering } from "./tests/test-post-clustering"
import { testUserEmbeddings } from "./tests/test-user-embeddings"

const logger = getLogger("SwipeEngineInit")

/**
 * Testa o modelo de embeddings baixando e gerando um embedding de teste
 */
async function testEmbeddingModel() {
    const MODEL_ID = "Xenova/all-MiniLM-L6-v2"
    const MODEL_CACHE_DIR = path.join(__dirname, "../models/embeddings-cache")
    let embeddingPipeline: FeatureExtractionPipeline | null = null

    try {
        logger.info("🔄 Testando modelo de embeddings...")

        // Configurar diretório de cache
        process.env.TRANSFORMERS_CACHE = MODEL_CACHE_DIR

        // Criar diretório se não existir
        if (!fs.existsSync(MODEL_CACHE_DIR)) {
            fs.mkdirSync(MODEL_CACHE_DIR, { recursive: true })
        }

        try {
            // Tentar carregar modelo localmente
            logger.info("📂 Tentando carregar modelo do cache local...")
            embeddingPipeline = await pipeline("feature-extraction", MODEL_ID, {
                cache_dir: MODEL_CACHE_DIR,
                local_files_only: true,
                quantized: true
            }) as FeatureExtractionPipeline
            
            logger.info("✅ Modelo carregado do cache local com sucesso")
        } catch (error) {
            // Se não encontrar localmente, baixar
            logger.info("⬇️ Modelo não encontrado localmente. Baixando...")
            embeddingPipeline = await pipeline("feature-extraction", MODEL_ID, {
                cache_dir: MODEL_CACHE_DIR,
                quantized: true
            }) as FeatureExtractionPipeline
            
            logger.info("✅ Modelo baixado e carregado com sucesso")
        }

        // Testar geração de embedding
        const testText = "Teste de embedding: usuário interessado em tecnologia e programação"
        logger.info("🧪 Gerando embedding de teste...")
        
        const output = await embeddingPipeline(testText, {
            pooling: 'mean',
            normalize: true
        })

        const embedding = Array.from(output.data).map(val => Number(val))
        logger.info(`✅ Embedding gerado com sucesso. Dimensão: ${embedding.length}`)

        // Salvar embedding de teste
        const outputPath = path.join(__dirname, "../models/init_test_embedding.json")
        fs.writeFileSync(outputPath, JSON.stringify({
            model: MODEL_ID,
            text: testText,
            embedding: embedding.slice(0, 10) // Salvar apenas os 10 primeiros valores para visualização
        }, null, 2))
        
        logger.info(`📝 Embedding de teste salvo em: ${outputPath}`)
        return true
    } catch (error) {
        logger.error("❌ Erro ao testar modelo de embeddings:", error)
        throw error // Propagar o erro para melhor diagnóstico
    }
}

/**
 * Inicializa o SwipeEngine V2 e executa testes iniciais
 */
export async function initSwipeEngineV2() {
    try {
        logger.info("🚀 Iniciando SwipeEngine V2...")

        // Testar modelo de embeddings
        const embeddingTestSuccess = await testEmbeddingModel()
        if (!embeddingTestSuccess) {
            throw new Error("Falha no teste do modelo de embeddings")
        }

        // Executar outros testes
        await testUserEmbeddings()
        
        logger.info("✅ SwipeEngine V2 inicializado com sucesso!")
    } catch (error) {
        logger.error("❌ Erro ao inicializar SwipeEngine V2:", error)
        throw error // Propagar o erro para que a aplicação saiba que houve falha na inicialização
    }
} 