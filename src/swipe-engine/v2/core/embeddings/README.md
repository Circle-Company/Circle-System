# Serviços de Embedding

Este diretório contém os serviços responsáveis por gerar e gerenciar embeddings (representações vetoriais) para usuários e posts no SwipeEngine.

## Visão Geral

Os embeddings são vetores de números de ponto flutuante que representam entidades (usuários ou posts) no espaço vetorial. Estes vetores capturam características semânticas e comportamentais das entidades, permitindo:

1. Comparação de similaridade entre entidades usando operações matemáticas simples
2. Agrupamento de entidades similares em clusters
3. Recomendações personalizadas com base na proximidade dos vetores

## Serviços Disponíveis

### BaseEmbeddingService

Classe abstrata base que define a API comum para todos os serviços de embedding.

### UserEmbeddingService

Gera e atualiza embeddings para usuários com base em:

-   Histórico de interações (likes, comentários, visualizações)
-   Padrões de visualização
-   Preferências de conteúdo
-   Informações demográficas

### PostEmbeddingService

Gera e atualiza embeddings para posts com base em:

-   Conteúdo textual
-   Tags/tópicos
-   Métricas de engajamento
-   Informações do autor

## Como Usar

### Inicialização dos Serviços

```typescript
import { createEmbeddingServices } from "../embeddings"

// Inicializar serviços
const embeddingServices = createEmbeddingServices({
    embeddingDimension: 128,
    modelPath: {
        user: "models/user_embedding_model",
        post: "models/post_embedding_model",
    },
    repositories: {
        user: userRepository,
        interaction: interactionRepository,
        userEmbedding: userEmbeddingRepository,
        post: postRepository,
        postEmbedding: postEmbeddingRepository,
        tag: tagRepository,
    },
})

// Acessar serviços individuais
const { userEmbeddingService, postEmbeddingService } = embeddingServices
```

### Gerando Embeddings

```typescript
// Obter embedding de usuário
const userEmbedding = await userEmbeddingService.getUserEmbedding(userId)

// Obter embedding de post
const postEmbedding = await postEmbeddingService.getPostEmbedding(postId)
```

### Atualizando Embeddings

```typescript
// Para usuários - após uma nova interação
const updatedEmbedding = await userEmbeddingService.updateEmbedding(
    currentEmbedding,
    newInteraction
)

// Para posts - após atualização de engajamento
const updatedEmbedding = await postEmbeddingService.updateEmbedding(currentEmbedding, {
    engagementMetrics: updatedMetrics,
    lastInteraction: new Date(),
})
```

## Dimensão dos Embeddings

Todos os embeddings gerados têm dimensão fixa, configurável na criação dos serviços (padrão: 128). Essa dimensão deve ser consistente em todo o sistema para permitir comparações de similaridade e clustering.

## Componentes dos Embeddings

### Embeddings de Usuário

1. **Componente de Interação (50%)**: Captura padrões de interação com diferentes tipos de conteúdo
2. **Componente de Preferência (30%)**: Representa interesses e preferências declarados ou inferidos
3. **Componente Social/Demográfico (20%)**: Incorpora fatores demográficos e sociais

### Embeddings de Post

1. **Componente de Texto (50%)**: Representa a semântica do conteúdo textual
2. **Componente de Tags (30%)**: Captura tópicos e categorias do post
3. **Componente de Engajamento (20%)**: Incorpora métricas de popularidade e engajamento

## Processamento em Lote

Para processar grandes volumes de entidades, use os métodos de lote:

```typescript
// Gerar embeddings para múltiplos posts
const batchEmbeddings = await postEmbeddingService.batchGenerateEmbeddings(postIds)
```

## Persistência de Embeddings

Os embeddings são armazenados automaticamente nos repositórios correspondentes após geração ou atualização. O sistema implementa um mecanismo de cache para evitar recálculos frequentes.

## Considerações de Performance

-   A geração de embeddings é uma operação computacionalmente intensiva
-   Para otimização, os embeddings são apenas recalculados após mudanças significativas
-   Posts: Recalculados a cada 24 horas ou quando o engajamento muda significativamente
-   Usuários: Recalculados a cada 7 dias ou após interações significativas

## Extensão

Para implementar embeddings para novas entidades:

1. Crie uma nova classe estendendo `BaseEmbeddingService`
2. Implemente os métodos abstratos: `generateEmbedding`, `updateEmbedding` e `loadModelImplementation`
3. Crie interfaces para os repositórios necessários
4. Atualize a factory de embeddings para incluir o novo serviço
