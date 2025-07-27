// Este script testa a geração de embedding usando a biblioteca xenova/transformers diretamente
const { pipeline } = require('@xenova/transformers');
const path = require('path');

async function testEmbedding() {
    console.log("Iniciando teste de embedding...");
    
    try {
        // Configurar diretório de cache
        const cacheDir = path.join(process.cwd(), 'models/xenova-cache');
        process.env.TRANSFORMERS_CACHE = cacheDir;
        console.log(`Usando diretório de cache: ${cacheDir}`);
        
        console.log("Carregando modelo sentence-transformers/all-MiniLM-L6-v2...");
        const model = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2', {
            cache_dir: cacheDir,
            revision: 'main'
        });
        
        console.log("Modelo carregado com sucesso!");
        
        const text = "Este é um teste para gerar embeddings";
        console.log(`Gerando embedding para: "${text}"`);
        
        const output = await model(text, {
            pooling: 'mean',
            normalize: true
        });
        
        console.log("Embedding gerado com sucesso!");
        console.log(`Dimensão: ${output.data.length}`);
        console.log(`Primeiros 5 valores: ${Array.from(output.data.slice(0, 5))}`);
        
        return true;
    } catch (error) {
        console.error("Erro:", error);
        return false;
    }
}

testEmbedding().then(success => {
    if (success) {
        console.log("Teste concluído com sucesso!");
        process.exit(0);
    } else {
        console.error("Teste falhou!");
        process.exit(1);
    }
}); 