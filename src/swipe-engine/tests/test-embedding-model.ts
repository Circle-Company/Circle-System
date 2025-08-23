import * as fs from "fs"
import * as path from "path"

import { FeatureExtractionPipeline, pipeline } from "@xenova/transformers"

import { getLogger } from "../core/utils/logger"
import { normalizeL2 } from "../core/utils/normalization"

const logger = getLogger("test-embedding-model")

interface TestUserData {
    interactionHistory: string[]
    viewingPatterns: string[]
    preferences: string[]
    demographics: string[]
}

class EmbeddingModelTester {
    private embeddingPipeline: FeatureExtractionPipeline | null = null
    private readonly MODEL_ID = "jinaai/jina-embeddings-v3"
    private readonly MODEL_CACHE_DIR = path.join(__dirname, "../../../models/jina-embeddings-v3")

    async initialize(): Promise<void> {
        try {
            logger.info("Inicializando modelo de embeddings...")

            // Configurar diretório de cache
            process.env.TRANSFORMERS_CACHE = this.MODEL_CACHE_DIR

            // Criar diretório se não existir
            if (!fs.existsSync(this.MODEL_CACHE_DIR)) {
                fs.mkdirSync(this.MODEL_CACHE_DIR, { recursive: true })
            }

            try {
                // Tentar carregar modelo localmente primeiro
                this.embeddingPipeline = await pipeline("feature-extraction", this.MODEL_ID, {
                    cache_dir: this.MODEL_CACHE_DIR,
                    local_files_only: true
                }) as FeatureExtractionPipeline
                
                logger.info("Modelo carregado do cache local")
            } catch (error) {
                // Se não encontrar localmente, baixar
                logger.info("Modelo não encontrado localmente. Baixando...")
                this.embeddingPipeline = await pipeline("feature-extraction", this.MODEL_ID, {
                    cache_dir: this.MODEL_CACHE_DIR
                }) as FeatureExtractionPipeline
                
                logger.info("Modelo baixado e carregado com sucesso")
            }
        } catch (error) {
            logger.error("Erro ao inicializar modelo:", error)
            throw error
        }
    }

    private prepareText(userData: TestUserData): string {
        const parts: string[] = []

        if (userData.interactionHistory.length > 0) {
            parts.push(`Interações: ${userData.interactionHistory.join(", ")}`)
        }

        if (userData.viewingPatterns.length > 0) {
            parts.push(`Padrões de visualização: ${userData.viewingPatterns.join(", ")}`)
        }

        if (userData.preferences.length > 0) {
            parts.push(`Preferências: ${userData.preferences.join(", ")}`)
        }

        if (userData.demographics.length > 0) {
            parts.push(`Demografia: ${userData.demographics.join(", ")}`)
        }

        return parts.join("\n")
    }

    async generateEmbedding(userData: TestUserData): Promise<number[]> {
        if (!this.embeddingPipeline) {
            throw new Error("Modelo não inicializado")
        }

        try {
            const text = this.prepareText(userData)
            
            const output = await this.embeddingPipeline(text, {
                pooling: 'mean',
                normalize: true
            })

            const embedding = Array.from(output.data).map(val => Number(val))
            return normalizeL2(embedding)
        } catch (error) {
            logger.error("Erro ao gerar embedding:", error)
            throw error
        }
    }
}

// Função para testar o modelo
async function testModel() {
    const tester = new EmbeddingModelTester()
    await tester.initialize()

    // Dados de teste
    const testUser: TestUserData = {
        interactionHistory: [
            "visualizou vídeo de tecnologia",
            "curtiu post sobre programação",
            "comentou em artigo sobre IA"
        ],
        viewingPatterns: [
            "prefere vídeos curtos",
            "assiste em horário noturno",
            "completa 80% dos vídeos"
        ],
        preferences: [
            "tecnologia",
            "programação",
            "inteligência artificial"
        ],
        demographics: [
            "faixa etária 25-34",
            "localização: São Paulo",
            "idioma: português"
        ]
    }

    try {
        logger.info("Gerando embedding para usuário de teste...")
        const embedding = await tester.generateEmbedding(testUser)
        logger.info(`Embedding gerado com sucesso. Dimensão: ${embedding.length}`)
        
        // Salvar embedding de teste
        const outputPath = path.join(__dirname, "../../../models/test_embedding.json")
        fs.writeFileSync(outputPath, JSON.stringify({
            userData: testUser,
            embedding: embedding
        }, null, 2))
        
        logger.info(`Embedding de teste salvo em: ${outputPath}`)
    } catch (error) {
        logger.error("Erro ao testar modelo:", error)
        throw error
    }
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testModel()
        .then(() => {
            logger.info("Teste concluído com sucesso")
            process.exit(0)
        })
        .catch((error) => {
            logger.error("Erro durante o teste:", error)
            process.exit(1)
        })
} 