from transformers import AutoTokenizer, AutoModel
import os
import sys

def download_model():
    model_id = "sentence-transformers/all-MiniLM-L6-v2"
    cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "all-MiniLM-L6-v2")
    
    print(f"Baixando modelo {model_id}...")
    print(f"Diretório de cache: {cache_dir}")
    
    try:
        # Criar diretório se não existir
        os.makedirs(cache_dir, exist_ok=True)
        
        # Baixar tokenizer
        print("Baixando tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            model_id, 
            cache_dir=cache_dir
        )
        print("Tokenizer baixado com sucesso!")
        
        # Baixar modelo
        print("Baixando modelo...")
        model = AutoModel.from_pretrained(
            model_id, 
            cache_dir=cache_dir
        )
        print("Modelo baixado com sucesso!")
        
        # Verificar arquivos
        model_dir = os.path.join(cache_dir, "models--sentence-transformers--all-MiniLM-L6-v2", "snapshots")
        snapshots = [d for d in os.listdir(model_dir) if os.path.isdir(os.path.join(model_dir, d))]
        if not snapshots:
            raise Exception("Nenhum snapshot encontrado")
        model_dir = os.path.join(model_dir, snapshots[0])
        
        required_files = [
            'config.json',
            'tokenizer_config.json',
            'tokenizer.json',
            'model.safetensors',
            'special_tokens_map.json'
        ]
        
        print("\nVerificando arquivos baixados:")
        for file in required_files:
            file_path = os.path.join(model_dir, file)
            if os.path.exists(file_path):
                size = os.path.getsize(file_path) / (1024 * 1024)  # Tamanho em MB
                print(f"✓ {file} ({size:.2f} MB)")
            else:
                print(f"✗ {file} (não encontrado)")
        
        print("\nDownload concluído!")
        
    except Exception as e:
        print(f"\nErro ao baixar modelo: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    download_model() 