# Estrutura Modular do Circle

Esta estrutura modular integra-se ao SwipeEngine existente, fornecendo componentes especializados para gerenciamento de embeddings, clustering e personalização de feed.

## Visão Geral

A estrutura foi projetada para complementar o `SwipeEngine` existente, organizando funcionalidades em módulos distintos:

```
modules/
│
├── users/                    # Módulos relacionados a usuários
│   ├── embedding/            # Construção e atualização de embeddings de usuário
│   ├── clustering/           # Gerenciamento de clusters de usuários
│   └── preferences/          # Serviços de preferências e comportamento
│
├── posts/                    # Módulos relacionados a posts
│   ├── embedding/            # Construção de embeddings para posts
│   ├── clustering/           # Gerenciamento de clusters de conteúdo
│   └── engagement/           # Rastreamento e previsão de engajamento
│
└── feed/                     # Módulos de composição de feed
    ├── ranking/              # Ordenação de conteúdo
    ├── diversity/            # Otimização de diversidade
    └── freshness/            # Fatores de temporalidade e tendências
```

## Integração com SwipeEngine

Estes módulos utilizam serviços e utilidades do SwipeEngine v2, ampliando suas funcionalidades sem duplicar código existente. Principais integrações:

1. **Serviços de Embedding**: Aproveitam `UserEmbeddingService` e `PostEmbeddingService` do SwipeEngine
2. **Algoritmos de Clustering**: Utilizam implementações como `KMeansClustering` do SwipeEngine
3. **Utilitários**: Reutilizam funções como `normalizeVector` e `cosineSimilarity`

## Como Usar

```typescript
// Exemplo de uso do módulo de ranking
import { PostRanker } from "../modules/feed/ranking/PostRanker"
import { createSwipeEngine } from "../swipe-engine/v2"

const swipeEngine = createSwipeEngine()
const postRanker = new PostRanker(swipeEngine)

// Obter posts classificados para um usuário
const rankedPosts = await postRanker.rankPostsForUser(userId)
```
