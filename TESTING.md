# 🧪 Configuração de Testes - Circle System

## 📝 Visão Geral

O Circle System utiliza **Vitest** como framework de testes, proporcionando uma experiência rápida e moderna para testes em TypeScript.

## 🛠️ Configuração

### Arquivos de Configuração

- **`vitest.config.ts`**: Configuração principal do Vitest
- **`test.setup.ts`**: Setup global dos testes com mocks e utilitários

### Estrutura de Diretórios

```
src/
├── classes/
│   ├── user/
│   │   ├── BaseUser.test.ts
│   │   ├── FreeUser.test.ts
│   │   ├── PremiumUser.test.ts
│   │   └── UserFactory.test.ts
│   └── plans/
│       └── FeatureUsageService.test.ts
├── controllers/
│   ├── subscription/
│   │   └── *.test.ts
│   └── webhook/
│       └── *.test.ts
├── middlewares/
│   └── premium-validation.test.ts
└── services/
    └── *.test.ts
```

## 🚀 Scripts de Teste

### Scripts Principais

```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage
```

### Scripts Específicos

```bash
# Testar classes específicas
npm run test:classes
npm run test:user-classes
npm run test:user-factory

# Testar controllers e middlewares
npm run test:controllers
npm run test:middlewares
npm run test:services

# Testar features específicas
npm run test:premium
npm run test:boost
npm run test:analytics
npm run test:rate-limit
npm run test:storage

# Testar validações
npm run test:validation
```

## ⚙️ Configurações Detalhadas

### Coverage

- **Provider**: v8 (nativo do Node.js)
- **Thresholds**: 70-75% para branches, functions, lines e statements
- **Relatórios**: text, json, html
- **Output**: `./coverage/`

### Timeouts

- **Test Timeout**: 15 segundos
- **Hook Timeout**: 10 segundos
- **Teardown Timeout**: 5 segundos

### Aliases de Path

```typescript
{
  '@': './src',
  '@classes': './src/classes',
  '@controllers': './src/controllers',
  '@middlewares': './src/middlewares',
  '@services': './src/services',
  '@models': './src/models',
  '@errors': './src/errors',
  '@swipe-engine': './src/swipe-engine',
  '@routes': './src/routes',
  '@libs': './src/libs',
  '@math': './src/math',
  '@pages': './src/pages'
}
```

## 🧩 Mocks Globais

### APIs Externas

- **Google Play API**: Mock completo para validação de assinaturas
- **AWS S3**: Mock para upload de arquivos
- **Cron Jobs**: Mock para agendamento de tarefas
- **Crypto**: Mock para verificação de assinaturas de webhook

### Database

- **Sequelize**: Mock básico com operações CRUD
- **Operadores**: Mock dos operadores do Sequelize (Op.gt, Op.lt, etc.)

### Utilitários

- **fetch**: Mock global para requisições HTTP
- **waitFor**: Utilitário para aguardar operações assíncronas
- **Console**: Logs suprimidos para reduzir ruído nos testes

## 📋 Padrões de Teste

### Estrutura de Arquivos

```typescript
// user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('User Class', () => {
  beforeEach(() => {
    // Setup específico do teste
  })

  it('should create user correctly', () => {
    // Arrange
    const userData = { id: 1, name: 'Test' }
    
    // Act
    const user = new User(userData)
    
    // Assert
    expect(user.name).toBe('Test')
  })
})
```

### Mocking

```typescript
// Mock de módulos
vi.mock('./service', () => ({
  UserService: {
    create: vi.fn().mockResolvedValue({ id: 1 })
  }
}))

// Mock de funções
const mockFunction = vi.fn().mockReturnValue('mocked value')
```

### Testes Assíncronos

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

## 🎯 Cobertura de Código

### Incluído no Coverage

- `src/classes/**`
- `src/controllers/**`
- `src/middlewares/**`
- `src/services/**`
- `src/models/**`

### Excluído do Coverage

- Arquivos de teste (`*.test.ts`, `*.spec.ts`)
- Arquivos de tipos (`types.ts`)
- Arquivos de índice (`index.ts`)
- Configurações (`src/config/**`)
- Migrações (`src/migrations/**`)
- Testes do Swipe Engine (`src/swipe-engine/tests/**`)

## 🐛 Debugging

### Executar Teste Específico

```bash
# Teste único
npx vitest run src/classes/user/BaseUser.test.ts

# Com debug
npx vitest run src/classes/user/BaseUser.test.ts --reporter=verbose
```

### Modo Watch

```bash
# Watch com filtro
npx vitest --watch --grep="UserFactory"
```

### Coverage Detalhado

```bash
# Coverage para arquivo específico
npx vitest run --coverage src/classes/user/
```

## 🔧 Solução de Problemas

### Erro de Import

Verifique se os aliases estão configurados corretamente no `vitest.config.ts` e `tsconfig.json`.

### Timeout em Testes

Aumente o `testTimeout` no `vitest.config.ts` ou use `vi.setConfig({ testTimeout: 30000 })` em testes específicos.

### Mocks Não Funcionando

Certifique-se de que os mocks estão sendo chamados antes do import do módulo:

```typescript
vi.mock('./module', () => ({ ... }))
import { ModuleToTest } from './module-to-test'
```

### Performance

- Use `pool: 'forks'` com `singleFork: true` para estabilidade
- Configure `optimizeDeps` para dependências problemáticas
- Evite `vi.resetModules()` se não for necessário

## 📚 Recursos Adicionais

- [Documentação do Vitest](https://vitest.dev/)
- [Guia de Mocking](https://vitest.dev/guide/mocking.html)
- [API Reference](https://vitest.dev/api/)
