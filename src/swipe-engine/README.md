# Sistema de Recomendação Circle (Swipe Engine V2)

O Swipe Engine V2 é um sistema avançado de recomendação baseado em embeddings vetoriais que permite à plataforma Circle fornecer recomendações personalizadas aos usuários. Este sistema opera de forma independente, sem depender de versões anteriores do motor de recomendações.

## Arquitetura

O sistema é composto por vários componentes principais:

1. **RecommendationCoordinator**: Coordenador central que gerencia o fluxo de recomendação
2. **UserEmbeddingService**: Serviço para gerar e gerenciar embeddings de usuários
4. **Clustering**: Sistema de agrupamento de conteúdos similares
5. **API Simplificada**: Interface para integração com outros serviços

## Modelos de Dados

-   **Cluster**: Grupos de itens similares
-   **UserEmbedding**: Representações vetoriais de usuários
-   **PostEmbedding**: Representações vetoriais de posts
-   **InteractionEvent**: Interações de usuários com o sistema

## Fluxo de Recomendação

1. O usuário solicita recomendações (via feed ou outra interface)
2. O sistema verifica se o usuário possui um embedding; caso não, cria um
3. O engine busca clusters relevantes para o usuário
4. Candidatos são selecionados e ranqueados
5. Os posts recomendados são retornados ordenados por relevância
6. As interações do usuário são registradas para melhorar recomendações futuras

## Integração com o Serviço de Feed

O `find_user_feed_moments` foi completamente reescrito para utilizar exclusivamente o novo motor de recomendação:

1. Os dados do usuário são enviados para o Swipe Engine V2
2. As recomendações são processadas e enriquecidas com dados adicionais
3. As interações com o feed são registradas automaticamente para melhorar futuras recomendações
4. Tratamento robusto de erros garante uma experiência contínua

## Uso da API

```typescript
// Inicialização
import { initializeRecommendationSystem } from "./swipe-engine/services"
initializeRecommendationSystem()

// Obter recomendações
import { getRecommendations } from "./swipe-engine/services"
const recommendations = await getRecommendations(userId, options)

// Processar interações
import { processInteraction } from "./swipe-engine/services"
await processInteraction(userId, entityId, entityType, interactionType, metadata)

// Processar novos posts
import { processNewPost } from "./swipe-engine/services"
await processNewPost(postId)
```

## Benefícios do Novo Sistema

-   **Independência**: Sistema completamente autônomo, sem dependências de sistemas legados
-   **Personalização Avançada**: Recomendações adaptadas ao perfil, interesses e comportamento do usuário
-   **Diversidade Controlada**: Equilíbrio entre relevância e diversidade de conteúdo
-   **Descoberta**: Os usuários podem descobrir novos conteúdos que talvez não encontrassem naturalmente
-   **Aprendizado Contínuo**: O sistema evolui com as interações dos usuários

## Configuração e Otimização

Parâmetros como diversidade e novidade podem ser ajustados para controlar o comportamento do sistema:

```typescript
const options = {
    limit: 20, // Número de recomendações
    diversity: 0.4, // 0-1: quanto maior, mais diverso o feed
    novelty: 0.3, // 0-1: quanto maior, mais prioriza conteúdo recente
    context: {
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
    },
}
```

## Extensões Futuras

-   Implementar modelos ML mais avançados para geração de embeddings
-   Adicionar recomendações baseadas em colaboração (usuários similares)
-   Desenvolver dashboards para visualização e ajuste de parâmetros
-   Expandir para outros tipos de conteúdo além de posts
-   Implementar testes A/B para otimização contínua de parâmetros
