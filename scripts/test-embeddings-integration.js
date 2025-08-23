// Este script é um teste de integração simplificado para verificar o UserEmbeddingService
// Ele simula um fluxo completo de geração e recuperação de embeddings

// Configurações
const userId = 999;
const mockUserData = {
    interactionHistory: [
        { type: 'view', entityId: '123', entityType: 'post', timestamp: new Date().toISOString() },
        { type: 'like', entityId: '456', entityType: 'post', timestamp: new Date().toISOString() }
    ],
    viewingPatterns: [
        { contentType: 'video', averageDuration: 120, completionRate: 0.8, frequency: 5 }
    ],
    contentPreferences: ['tecnologia', 'música', 'esportes']
};

// Importações
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurar variáveis de ambiente
process.env.NODE_ENV = 'development';
process.env.TRANSFORMERS_CACHE = path.join(process.cwd(), 'models/xenova-cache');

// Diretório para salvar os resultados de teste
const testResultsDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
}

// Arquivo para resultados
const timestamp = new Date().toISOString().replace(/:/g, '-');
const resultsFile = path.join(testResultsDir, `embedding-test-${timestamp}.json`);

// Iniciar teste
console.log('Iniciando teste de integração do UserEmbeddingService...\n');

try {
    // Executar o teste através de um script TypeScript
    console.log('Executando teste de geração de embedding...');
    
    // Criar um arquivo temporário para o teste
    const testScript = path.join(testResultsDir, 'temp-embedding-test.js');
    
    fs.writeFileSync(testScript, `
        const { UserEmbeddingService } = require('../dist/swipe-engine/core/embeddings/UserEmbeddingService');
        
        async function runTest() {
            try {
                console.log('Criando instância do UserEmbeddingService...');
                const service = new UserEmbeddingService(384);
                
                console.log('Gerando embedding para usuário de teste...');
                const embedding = await service.generateEmbedding(${JSON.stringify(mockUserData)});
                
                console.log(\`Embedding gerado: \${embedding.length} dimensões\`);
                console.log(\`Primeiros 5 valores: \${embedding.slice(0, 5).join(', ')}\`);
                
                return {
                    success: true,
                    embedding: embedding,
                    dimensions: embedding.length,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                console.error('Erro no teste:', error);
                return {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }
        
        runTest().then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        });
    `);
    
    // Compilar o projeto antes de executar o teste
    console.log('Compilando o projeto...');
    execSync('npx tsc --skipLibCheck', { stdio: 'inherit' });
    
    // Executar o teste
    console.log('\nExecutando o teste...');
    const result = execSync(`node ${testScript}`).toString();
    
    // Salvar resultados
    fs.writeFileSync(resultsFile, result);
    console.log(`\nResultados salvos em: ${resultsFile}`);
    
    // Limpar arquivo temporário
    fs.unlinkSync(testScript);
    
    // Verificar resultado
    const parsedResult = JSON.parse(result);
    if (parsedResult.success) {
        console.log('\nTeste concluído com sucesso!');
        console.log(`Dimensões do embedding: ${parsedResult.dimensions}`);
        console.log(`Primeiros 5 valores: ${parsedResult.embedding.slice(0, 5).join(', ')}`);
    } else {
        console.error('\nTeste falhou!');
        console.error(`Erro: ${parsedResult.error}`);
        process.exit(1);
    }
} catch (error) {
    console.error('Erro ao executar teste:', error);
    process.exit(1);
} 