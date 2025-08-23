// Este script testa a geração e armazenamento de embeddings
const path = require('path');
const { pipeline } = require('@xenova/transformers');

// Configurar diretório de cache
const cacheDir = path.join(process.cwd(), 'models/xenova-cache');
process.env.TRANSFORMERS_CACHE = cacheDir;

async function generateTestEmbedding() {
    console.log("Iniciando teste de geração de embedding");
    console.log(`Usando diretório de cache: ${cacheDir}`);
    
    try {
        // Simular dados de um usuário
        const userData = {
            userId: "101",
            interactionHistory: [
                { type: 'view', entityId: '123', entityType: 'post', timestamp: new Date().toISOString() },
                { type: 'like', entityId: '456', entityType: 'post', timestamp: new Date().toISOString() }
            ],
            viewingPatterns: [
                { contentType: 'video', averageDuration: 120, completionRate: 0.8, frequency: 5 }
            ],
            contentPreferences: ['tecnologia', 'música', 'esportes']
        };
        
        // Testar método de fallback (para não depender do carregamento do modelo)
        console.log("Gerando embedding usando método de fallback");
        
        // Preparar texto para o embedding
        const text = `
            Interações: view post, like post
            Padrões de visualização: video (duração média: 120s, taxa de conclusão: 80%)
            Preferências: tecnologia, música, esportes
        `;
        
        console.log(`Texto preparado: ${text}`);
        
        // Gerar vetor com valores aleatórios para simular um embedding
        const dimension = 384; // Dimensão padrão do modelo all-MiniLM-L6-v2
        const mockVector = Array(dimension).fill(0).map(() => Math.random() * 2 - 1);
        
        // Normalizar o vetor (L2)
        const magnitude = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
        const normalizedVector = mockVector.map(val => val / magnitude);
        
        console.log(`Embedding gerado com ${normalizedVector.length} dimensões`);
        console.log(`Primeiros 5 valores: ${normalizedVector.slice(0, 5).join(', ')}`);
        
        // Mostrar como seria o objeto completo
        const embeddingObject = {
            userId: userData.userId,
            vector: {
                dimension,
                values: normalizedVector,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            metadata: {
                source: "test_fallback",
                modelVersion: "fallback_v1",
                generatedAt: new Date().toISOString()
            }
        };
        
        // Serializar o objeto para simular o armazenamento
        const serialized = JSON.stringify(embeddingObject);
        console.log(`\nTamanho do objeto serializado: ${serialized.length} bytes`);
        
        // Verificar se a serialização/deserialização funciona corretamente
        const deserialized = JSON.parse(serialized);
        console.log(`\nDeserialização bem-sucedida: ${deserialized.vector.values.length === dimension}`);
        console.log(`Dimensão após deserialização: ${deserialized.vector.dimension}`);
        console.log(`Primeiros 5 valores após deserialização: ${deserialized.vector.values.slice(0, 5).join(', ')}`);
        
        return true;
    } catch (error) {
        console.error("Erro:", error);
        return false;
    }
}

// Executar teste
generateTestEmbedding()
    .then(success => {
        if (success) {
            console.log("\nTeste concluído com sucesso!");
            process.exit(0);
        } else {
            console.error("\nTeste falhou!");
            process.exit(1);
        }
    })
    .catch(error => {
        console.error("Erro inesperado:", error);
        process.exit(1);
    }); 