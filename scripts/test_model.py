from transformers import AutoTokenizer, AutoModel, pipeline
import os
import sys

def test_model():
    model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "all-MiniLM-L6-v2")
    snapshot_dir = os.path.join(
        model_dir,
        "models--sentence-transformers--all-MiniLM-L6-v2",
        "snapshots",
        "c9745ed1d9f207416be6d2e6f8de32d1f16199bf"
    )
    
    print(f"Testando carregamento do modelo de: {snapshot_dir}")
    
    try:
        # Verificar se o diretório existe
        if not os.path.exists(snapshot_dir):
            print(f"ERRO: Diretório do snapshot não encontrado: {snapshot_dir}")
            sys.exit(1)
            
        # Listar arquivos no diretório
        print("\nArquivos no diretório do snapshot:")
        for file in os.listdir(snapshot_dir):
            file_path = os.path.join(snapshot_dir, file)
            if os.path.islink(file_path):
                link_target = os.readlink(file_path)
                print(f"- {file} -> {link_target}")
            else:
                print(f"- {file}")
        
        # Carregar tokenizer
        print("\nCarregando tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(snapshot_dir)
        print("Tokenizer carregado com sucesso!")
        
        # Carregar modelo
        print("\nCarregando modelo...")
        model = AutoModel.from_pretrained(snapshot_dir)
        print("Modelo carregado com sucesso!")
        
        # Testar pipeline
        print("\nCriando pipeline de feature-extraction...")
        feat_extractor = pipeline("feature-extraction", model=model, tokenizer=tokenizer)
        
        # Testar embedding
        print("\nGerando embedding de teste...")
        test_text = "Este é um teste de embedding"
        output = feat_extractor(test_text, return_tensors=True)
        
        # Verificar saída
        print(f"\nTamanho do embedding: {output.shape}")
        print(f"Primeiros 5 valores: {output.data[0][0][:5]}")
        
        print("\nTeste concluído com sucesso!")
        return True
    except Exception as e:
        print(f"\nERRO ao testar modelo: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_model()
    sys.exit(0 if success else 1) 