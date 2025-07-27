# Tipos de Interação - Sistema de Engajamento

Este documento descreve todos os tipos de interação disponíveis no sistema de ranqueamento de clusters, incluindo suas características, pesos e meias-vidas.

## Visão Geral

O sistema de engajamento utiliza diferentes tipos de interação para calcular scores de relevância dos clusters. Cada tipo tem:
- **Peso**: Impacto no score de engajamento (0.5 a 4.0)
- **Meia-vida**: Tempo para o peso cair pela metade (24h a 720h)
- **Significado**: O que a interação indica sobre o interesse do usuário

## Tipos de Interação

### 1. Visualizações

#### `view_parcial` (Visualização Parcial)
- **Peso**: 0.5
- **Meia-vida**: 24 horas
- **Critérios**: Duração < 30s OU percentual < 80%
- **Significado**: Interesse limitado ou visualização acidental
- **Uso**: Penaliza conteúdo que não capturou atenção

#### `view_completa` (Visualização Completa)
- **Peso**: 1.0
- **Meia-vida**: 48 horas
- **Critérios**: Duração ≥ 30s OU percentual ≥ 80%
- **Significado**: Interesse moderado no conteúdo
- **Uso**: Indica que o usuário realmente consumiu o conteúdo

### 2. Likes

#### `like` (Like no Conteúdo)
- **Peso**: 2.0
- **Meia-vida**: 168 horas (7 dias)
- **Significado**: Apreciação explícita do conteúdo
- **Uso**: Sinal positivo claro de satisfação

#### `like_comment` (Like em Comentário)
- **Peso**: 2.5
- **Meia-vida**: 192 horas (8 dias)
- **Significado**: Engajamento profundo com a discussão
- **Uso**: Indica interesse na comunidade e discussões

### 3. Comentários

#### `comment` (Comentário)
- **Peso**: 3.0
- **Meia-vida**: 336 horas (14 dias)
- **Significado**: Engajamento ativo e participação
- **Uso**: Sinal forte de interesse e envolvimento

### 4. Compartilhamentos

#### `share` (Compartilhamento)
- **Peso**: 4.0
- **Meia-vida**: 336 horas (14 dias)
- **Significado**: Endosso forte e recomendação
- **Uso**: Sinal mais forte de valor percebido

### 5. Salvamentos

#### `save` (Salvamento)
- **Peso**: 3.5
- **Meia-vida**: 720 horas (30 dias)
- **Significado**: Intenção de revisitar o conteúdo
- **Uso**: Indica valor de longo prazo

### 6. Ações Negativas

#### `dislike` (Dislike)
- **Peso**: -0.5
- **Meia-vida**: 168 horas (7 dias)
- **Significado**: Desaprovação ou desinteresse
- **Uso**: Reduz recomendações similares

#### `report` (Denúncia)
- **Peso**: -1.0
- **Meia-vida**: 720 horas (30 dias)
- **Significado**: Rejeição completa do conteúdo
- **Uso**: Evita fortemente conteúdo similar

#### `show_less_often` (Mostrar Menos Frequentemente)
- **Peso**: -0.6
- **Meia-vida**: 336 horas (14 dias)
- **Significado**: Desinteresse contínuo
- **Uso**: Reduz significativamente conteúdo similar

### 7. Outros

#### `click` (Clique)
- **Peso**: 0.3 (padrão)
- **Meia-vida**: 48 horas (padrão)
- **Significado**: Interesse básico
- **Uso**: Sinal genérico de engajamento

## Funções de Processamento

### `determineViewType(durationSeconds, watchPercentage)`
Determina se uma visualização é parcial ou completa baseado em:
- **Duração**: Tempo gasto visualizando o conteúdo
- **Percentual**: Porcentagem do conteúdo visualizado

```typescript
const viewType = determineViewType(45, 0.9) // Retorna 'view_completa'
```

### `processViewInteraction(interaction, durationSeconds, watchPercentage)`
Processa uma interação de visualização e adiciona metadados:
- Duração da visualização
- Percentual visualizado
- Tipo de visualização determinado

### `processCommentLikeInteraction(interaction, commentId)`
Processa um like em comentário específico:
- Adiciona ID do comentário aos metadados
- Marca como `like_comment`

### `processSaveInteraction(interaction, saveReason?)`
Processa um salvamento:
- Adiciona motivo do salvamento (opcional)
- Marca como `save`

## Hierarquia de Importância

```
1. Compartilhamento (4.0) - Máximo engajamento
2. Salvamento (3.5) - Valor de longo prazo
3. Comentário (3.0) - Participação ativa
4. Like em comentário (2.5) - Engajamento profundo
5. Like (2.0) - Apreciação explícita
6. Visualização completa (1.0) - Interesse moderado
7. Visualização parcial (0.5) - Interesse limitado
```

## Configuração

Todos os pesos e meias-vidas são configuráveis através do arquivo `params.ts`:

```typescript
export const ClusterRankingParams = {
    engagementFactors: {
        recency: {
            halfLifeHours: {
                view_parcial: 24,
                view_completa: 48,
                like: 168,
                like_comment: 192,
                comment: 336,
                share: 336,
                save: 720
            }
        },
        interactionWeights: {
            view_parcial: 0.5,
            view_completa: 1.0,
            like: 2.0,
            like_comment: 2.5,
            comment: 3.0,
            share: 4.0,
            save: 3.5
        }
    }
}
```

## Uso no Sistema

As interações são processadas pelo `ClusterRankingAlgorithm` que:

1. **Filtra** interações relevantes para cada cluster
2. **Aplica** decaimento temporal baseado na meia-vida
3. **Calcula** score ponderado por tipo de interação
4. **Normaliza** o score final para o intervalo [0, 1]

## Monitoramento

O sistema fornece métricas detalhadas:
- Distribuição de tipos de interação por cluster
- Taxa de engajamento por tipo
- Padrões temporais de interação
- Correlação entre tipos de interação e scores de cluster

## Considerações de Performance

- Interações antigas (além da meia-vida) têm impacto mínimo
- Limite de 100 interações por usuário para evitar viés
- Processamento em lote para otimização
- Cache de scores calculados para clusters frequentes 