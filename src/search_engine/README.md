# 🔍 Circle Search Engine

Motor de busca de usuários do Circle App, projetado para fornecer resultados relevantes e personalizados baseados em múltiplos critérios e interações do usuário.

### Objetivo

O Search Engine foi desenvolvido para oferecer uma experiência de busca otimizada, combinando resultados de diferentes fontes e aplicando algoritmos de classificação personalizados. O sistema prioriza:

-   Relevância dos resultados
-   Personalização baseada em conexões do usuário
-   Performance e escalabilidade
-   Segurança e filtragem de conteúdo

## Arquitetura

### Componentes Principais

```
search_engine/
├── src/
│   ├── modules/
│   │   ├── is_valid_search/      # Validação de termos de busca
│   │   ├── related_candidates/    # Busca de usuários relacionados
│   │   ├── unknown_candidates/    # Descoberta de novos usuários
│   │   └── search_mixer/         # Combinação de resultados
│   ├── database/                 # Configurações e regras
│   ├── functions/               # Funções utilitárias
│   └── types.ts                # Definições de tipos
└── tests/                      # Testes unitários e de integração
```

### Fluxo de Processamento

1. **Validação da Busca**

    - Verificação de comprimento
    - Sanitização de entrada
    - Prevenção de SQL Injection

2. **Busca de Candidatos Relacionados**

    ```typescript
    interface RelatedCandidatesProps {
        user_id: bigint
        search_term: string
    }
    ```

    - Encontra usuários conectados
    - Remove duplicatas
    - Filtra por termo de busca
    - Calcula scores

3. **Busca de Candidatos Desconhecidos**

    ```typescript
    interface UnknownCandidatesProps {
        user_id: bigint
        search_term: string
        related_candidates_list: any[]
    }
    ```

    - Descobre novos usuários
    - Subtrai candidatos relacionados
    - Adiciona interações
    - Filtra top candidatos

4. **Mixer de Resultados**
    - Combina resultados relacionados e desconhecidos
    - Aplica coeficiente de mistura (MIX_COEFFICIENT)
    - Ordena por relevância
    - Aplica filtros de segurança

## Algoritmos de Pontuação

### Candidatos Relacionados

-   Seguidores mútuos
-   Interações prévias
-   Distância na rede social
-   Relevância do termo de busca

### Candidatos Desconhecidos

-   Correspondência com termo de busca
-   Número de seguidores
-   Status de verificação
-   Atividade na plataforma

## Configurações

```json
{
    "min_search_length": 1,
    "max_search_length": 50,
    "MIX_COEFFICIENT": 0.8
}
```

## Filtros de Segurança

O módulo implementa diversos filtros de segurança:

-   Remoção de usuários bloqueados
-   Filtragem de conteúdo impróprio
-   Validação de permissões
-   Sanitização de dados

## Tipos de Retorno

```typescript
type ReturnUserProps = {
    id: bigint
    username: string
    verifyed: boolean
    name: null | string
    profile_picture: {
        tiny_resolution: null | string
    }
    statistics: {
        total_followers_num: number
    }
    you_follow: boolean
}
```

## Testes

O módulo possui cobertura completa de testes:

```bash
npm run test:search-engine
```

### Principais Casos de Teste

-   Validação de termos de busca
-   Mistura de resultados
-   Filtros de segurança
-   Ordenação de candidatos
-   Remoção de duplicações

## Performance

-   Otimização de consultas SQL
-   Índices otimizados

## Integração

```typescript
import { SearchEngine } from "./search_engine"

const results = await SearchEngine({
    userId: BigInt(1),
    searchTerm: "some search term",
})
```

## Escalabilidade

O módulo foi projetado para escalar:

-   Processamento assíncrono
-   Estrutura modular
-   Cache distribuído
-   Otimização de consultas

## Contribuindo

1. Entenda a arquitetura
2. Siga os padrões de código
3. Adicione testes
4. Documente alterações

---

**Nota**: Este módulo é somente parte do Circle System e deve ser mantido em sincronia com as atualizações do sistema principal.
