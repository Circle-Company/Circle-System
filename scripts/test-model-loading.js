// Script para testar carregamento do modelo usando importação correta
const path = require('path');

// Caminho absoluto para o serviço
const userEmbeddingServicePath = path.join(
    __dirname, 
    '../dist/swipe-engine/core/embeddings/UserEmbeddingService.js'
);

console.log(`Tentando importar do caminho: ${userEmbeddingServicePath}`);

// Importar serviço
const { UserEmbeddingService } = require(userEmbeddingServicePath);

async function testModelLoading() {
    console.log('Iniciando teste de carregamento do modelo...');
    
    try {
        // Criar instância do serviço
        const service = new UserEmbeddingService();
        
        // Gerar um embedding de teste
        const testData = {
            interactionHistory: [
                { type: 'view', entityId: '123', entityType: 'post', timestamp: new Date().toISOString() }
            ],
            viewingPatterns: [
                { contentType: 'video', averageDuration: 120, completionRate: 0.8, frequency: 5 }
            ],
            contentPreferences: ['tecnologia', 'música']
        };
        
        console.log('Gerando embedding de teste...');
        const embedding = await service.generateEmbedding(testData);
        
        console.log('Teste concluído com sucesso!');
        console.log(`Embedding gerado (primeiros 5 valores): ${embedding.slice(0, 5).join(', ')}`);
        
        return true;
    } catch (error) {
        console.error('Erro no teste:', error);
        return false;
    }
}

// Executar teste
testModelLoading().then(success => {
    if (success) {
        console.log('Teste concluído com sucesso!');
        process.exit(0);
    } else {
        console.error('Teste falhou!');
        process.exit(1);
    }
}); 