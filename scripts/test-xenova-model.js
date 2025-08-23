// Script para testar o carregamento do modelo com @xenova/transformers
const { pipeline } = require('@xenova/transformers');
const path = require('path');

async function testModelLoading() {
    console.log('Iniciando teste de carregamento do modelo com @xenova/transformers...');
    
    try {
        // Configurar cache
        const modelId = "sentence-transformers/all-MiniLM-L6-v2";
        const cacheDir = path.join(process.cwd(), "models/all-MiniLM-L6-v2");
        
        console.log(`ID do modelo: ${modelId}`);
        console.log(`Diretório de cache: ${cacheDir}`);
        
        // Definir variável de ambiente para o cache
        process.env.TRANSFORMERS_CACHE = cacheDir;
        console.log(`TRANSFORMERS_CACHE definido como: ${process.env.TRANSFORMERS_CACHE}`);
        
        // Carregar pipeline
        console.log('Carregando pipeline de feature-extraction...');
        const extractor = await pipeline('feature-extraction', modelId, {
            cache_dir: "models/all-MiniLM-L6-v2",
            local_files_only: true,
            quantized: false
        });
        
        // Testar embedding
        console.log('Gerando embedding de teste...');
        const text = 'Este é um teste de embedding';
        const output = await extractor(text, {
            pooling: 'mean',
            normalize: true
        });
        
        console.log('Embedding gerado com sucesso!');
        console.log(`Dimensão: ${output.data.length}`);
        console.log(`Primeiros 5 valores: ${Array.from(output.data.slice(0, 5))}`);
        
        return true;
    } catch (error) {
        console.error('Erro ao carregar modelo:', error);
        return false;
    }
}

// Executar teste
testModelLoading()
    .then(success => {
        if (success) {
            console.log('Teste concluído com sucesso!');
            process.exit(0);
        } else {
            console.error('Teste falhou!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('Erro inesperado:', error);
        process.exit(1);
    }); 