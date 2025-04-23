# Exemplos do SwipeEngine V2

Este diretório contém exemplos de utilização do motor de recomendação SwipeEngine V2.

## SimCluster Test Runner

O `simcluster-test-runner.ts` é uma ferramenta completa para testar o funcionamento do sistema de recomendação com dados simulados. Esta ferramenta:

1. Gera embeddings de usuários e posts simulados
2. Constrói SimClusters a partir desses dados
3. Salva os clusters gerados em arquivos JSON para reuso
4. Demonstra o algoritmo de recomendação em funcionamento

### Como Executar

```bash
# Usando o script npm (recomendado)
npm run test:simclusters

# OU usando ts-node diretamente
npx ts-node src/swipe-engine/v2/examples/simcluster-test-runner.ts
```

### Estrutura de Dados Gerados

Os dados simulados e os clusters são salvos no diretório `src/swipe-engine/v2/data/`:

-   `user-embeddings.json`: Embeddings de usuários simulados
-   `post-embeddings.json`: Embeddings de posts simulados
-   `user-clusters.json`: Clusters de usuários gerados
-   `post-clusters.json`: Clusters de posts gerados

Estes arquivos são reutilizados em execuções subsequentes, para que você não precise reconstruir os clusters a cada execução.

### Configuração

Você pode configurar o comportamento da simulação editando as constantes no objeto `CONFIG` no início do arquivo:

```typescript
const CONFIG = {
    // Dimensões dos embeddings
    embeddingDimension: 64,

    // Quantidade de dados
    totalUsers: 500,
    totalPosts: 1000,

    // Configurações de clustering
    dbscan: {
        epsilon: 0.3,
        minPoints: 5,
        distanceFunction: "cosine" as "cosine",
    },

    // ... outras configurações
}
```

### Entendendo a Saída

A ferramenta gera diversas informações no console:

1. **Geração/Carregamento de Dados**: Informações sobre os dados simulados gerados ou carregados
2. **Construção de Clusters**: Detalhes sobre os clusters criados
3. **Demonstração de Recomendação**:
    - Usuário selecionado aleatoriamente e seus atributos
    - Clusters relevantes encontrados para este usuário
    - Conteúdo recomendado com base nos clusters relevantes

### Regenerando os Dados

Se desejar gerar novos dados e clusters, simplesmente apague os arquivos de dados existentes:

```bash
rm -rf src/swipe-engine/v2/data/*.json
```

Na próxima execução, novos dados serão gerados.

## Outros Exemplos

### Cluster Matcher Demo

O `cluster-matcher-demo.ts` demonstra especificamente o funcionamento do componente `ClusterMatcher`, mostrando como ele encontra clusters relevantes para um usuário com base em seu embedding, perfil e contexto.

```bash
npx ts-node src/swipe-engine/v2/examples/cluster-matcher-demo.ts
```

Este exemplo é mais focado e não requer persistência de dados.
