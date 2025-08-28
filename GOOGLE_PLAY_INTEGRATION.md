# Integração Google Play Store - Circle System

Este documento detalha a implementação completa do sistema de assinaturas premium integrado com o Google Play Store.

## 📋 Visão Geral

O sistema implementa:
- ✅ Validação de receitas do Google Play Store
- ✅ Gerenciamento de assinaturas premium
- ✅ Webhook para notificações em tempo real
- ✅ Sistema de features premium
- ✅ Rate limiting baseado em subscription tier
- ✅ Logs detalhados de validação
- ✅ Jobs automáticos de validação
- ✅ Middleware de validação de pagamentos

## 🗂️ Estrutura de Arquivos

```
src/
├── services/
│   ├── google-play/
│   │   ├── GooglePlayService.ts          # Serviço principal do Google Play
│   │   └── integration-example.ts        # Exemplos de integração
│   └── subscription/
│       └── SubscriptionManager.ts        # Gerenciador de assinaturas
├── controllers/
│   ├── subscription/
│   │   └── subscription-controller.ts    # Controller de assinaturas
│   └── webhook/
│       └── google-play-webhook.ts        # Webhook handler
├── models/
│   └── subscription/
│       ├── user-subscription-model.ts           # Modelo de assinaturas
│       └── subscription-validation-log-model.ts # Logs de validação
├── database/
│   └── migrations/
│       ├── 20241201000001-create-user-subscriptions.js
│       └── 20241201000002-create-subscription-validation-logs.js
├── middlewares/
│   └── subscription-middleware.ts        # Middlewares de validação
├── routes/
│   └── subscription.ts                   # Rotas da API
├── config/
│   └── google-play.ts                    # Configurações
├── jobs/
│   └── subscription-validation-job.ts    # Jobs automáticos
└── migrations/
    ├── 20241201000001-create-user-subscriptions.sql
    └── 20241201000002-create-subscription-validation-logs.sql
```

## 🚀 Configuração Inicial

### 1. Configurar Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Play Android Developer API**
4. Crie uma **Conta de Serviço**:
   - Vá para **APIs & Services > Credentials**
   - Clique em **Create Credentials > Service Account**
   - Configure as permissões necessárias
   - Baixe o arquivo JSON da chave

### 2. Configurar Google Play Console

1. Acesse o [Google Play Console](https://play.google.com/console/)
2. Vá para **Setup > API access**
3. Vincule sua conta de serviço do Google Cloud
4. Configure os produtos de assinatura
5. Configure o webhook endpoint (opcional)

### 3. Variáveis de Ambiente

```bash
# .env
GOOGLE_PLAY_PACKAGE_NAME=com.circle.app
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=<base64_encoded_service_account_json>
GOOGLE_PLAY_PUBLIC_KEY=<optional_public_key_for_webhook_verification>
```

Para gerar a `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`:
```bash
base64 -i service-account-key.json | tr -d '\n'
```

### 4. Executar Migrações

```bash
# Execute as migrações usando Sequelize CLI:
npm run migrate:up

# Ou execute individualmente:
npx sequelize-cli db:migrate --to 20241201000001-create-user-subscriptions.js
npx sequelize-cli db:migrate --to 20241201000002-create-subscription-validation-logs.js
```

### 5. Instalar Dependências

```bash
npm install googleapis google-auth-library node-cron
```

## 📱 Fluxo de Assinatura

### 1. Cliente Mobile (Android)

```kotlin
// Exemplo em Kotlin/Android
private fun purchaseSubscription() {
    val billingFlowParams = BillingFlowParams.newBuilder()
        .setProductDetailsParamsList(listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .build()
        ))
        .build()
    
    billingClient.launchBillingFlow(activity, billingFlowParams)
}

private fun handlePurchase(purchase: Purchase) {
    // Enviar dados para o backend
    val purchaseData = mapOf(
        "purchaseToken" to purchase.purchaseToken,
        "productId" to purchase.products[0],
        "orderId" to purchase.orderId,
        "packageName" to packageName
    )
    
    // POST /api/subscription/activate
    apiService.activateSubscription(purchaseData)
}
```

### 2. Backend - Validação

```typescript
// POST /api/subscription/activate
{
  "purchaseToken": "token_do_google_play",
  "productId": "circle_premium_monthly",
  "orderId": "ORDER_123456",
  "packageName": "com.circle.app"
}
```

O sistema irá:
1. Validar o token com o Google Play
2. Verificar se não foi usado anteriormente
3. Criar registro na tabela `user_subscriptions`
4. Reconhecer a compra no Google Play
5. Ativar recursos premium para o usuário

## 🔗 Endpoints da API

### Assinaturas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/subscription/activate` | Ativar nova assinatura |
| GET | `/api/subscription/status` | Status da assinatura do usuário |
| GET | `/api/subscription/history` | Histórico de assinaturas |
| POST | `/api/subscription/:id/revalidate` | Revalidar assinatura |
| POST | `/api/subscription/:id/cancel` | Cancelar assinatura |
| GET | `/api/subscription/:id/logs` | Logs de validação |

### Features Premium

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/subscription/feature/:name/check` | Verificar acesso a feature |
| GET | `/api/subscription/features` | Listar features disponíveis |
| GET | `/api/subscription/premium/advanced-search` | Busca avançada (premium) |
| GET | `/api/subscription/premium/analytics` | Analytics avançado (premium) |
| POST | `/api/subscription/premium/moment-boost` | Boost de momento (premium) |
| POST | `/api/subscription/premium/profile-highlight` | Destaque de perfil (premium) |

### Webhook

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/subscription/webhook/google-play` | Webhook do Google Play |

### Administrativas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/subscription/admin/stats` | Estatísticas do sistema |
| GET | `/api/subscription/health` | Health check |

## 🛡️ Middlewares Disponíveis

### 1. Validação de Assinatura Premium

```typescript
import { requirePremiumSubscription } from '../middlewares/subscription-middleware'

router.get('/premium-feature', 
    requirePremiumSubscription,
    premiumFeatureController
)
```

### 2. Validação de Feature Específica

```typescript
import { requireFeatureAccess } from '../middlewares/subscription-middleware'

router.post('/advanced-search',
    requireFeatureAccess('advanced_search'),
    searchController
)
```

### 3. Rate Limiting por Subscription

```typescript
import { checkSubscriptionRateLimit } from '../middlewares/subscription-middleware'

router.post('/api/moments',
    checkSubscriptionRateLimit('POST /api/moments'),
    createMomentController
)
```

### 4. Limite Mensal de Features

```typescript
import { checkMonthlyLimit } from '../middlewares/subscription-middleware'

router.post('/boost-moment',
    checkMonthlyLimit('boosts'),
    boostMomentController
)
```

## 🔄 Webhook Notifications

O Google Play envia notificações para `/api/subscription/webhook/google-play` nos seguintes casos:

| Tipo | Código | Descrição |
|------|--------|-----------|
| SUBSCRIPTION_RECOVERED | 1 | Assinatura recuperada após falha |
| SUBSCRIPTION_RENEWED | 2 | Assinatura renovada |
| SUBSCRIPTION_CANCELED | 3 | Assinatura cancelada |
| SUBSCRIPTION_PURCHASED | 4 | Nova assinatura |
| SUBSCRIPTION_ON_HOLD | 5 | Em hold (problema pagamento) |
| SUBSCRIPTION_IN_GRACE_PERIOD | 6 | Período de graça |
| SUBSCRIPTION_RESTARTED | 7 | Assinatura reiniciada |
| SUBSCRIPTION_PRICE_CHANGE_CONFIRMED | 8 | Mudança de preço confirmada |
| SUBSCRIPTION_DEFERRED | 9 | Assinatura adiada |
| SUBSCRIPTION_PAUSED | 10 | Assinatura pausada |
| SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED | 11 | Cronograma de pausa alterado |
| SUBSCRIPTION_REVOKED | 12 | Assinatura revogada |
| SUBSCRIPTION_EXPIRED | 13 | Assinatura expirada |

## ⚙️ Jobs Automáticos

O sistema inclui jobs que executam automaticamente:

### 1. Revalidação de Assinaturas (6h)
- Verifica assinaturas próximas do vencimento
- Atualiza status baseado na validação

### 2. Verificação de Assinaturas Ativas (24h)
- Valida assinaturas não checadas recentemente
- Detecta cancelamentos não notificados

### 3. Limpeza de Logs (24h)
- Remove logs de validação >30 dias
- Mantém performance do banco

## 📊 Monitoramento

### Health Check

```bash
GET /api/subscription/health
```

Retorna estatísticas do sistema:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-12-01T12:00:00Z",
  "stats": {
    "activeSubscriptions": 150,
    "expiringIn24h": 5,
    "expiringIn7days": 25,
    "totalValidations24h": 450,
    "failedValidations24h": 12
  }
}
```

### Logs

O sistema gera logs detalhados em:
- Console output para debugging
- Tabela `subscription_validation_logs` para análise
- Métricas de performance e erro rates

## 🔧 Exemplos de Uso

### 1. Verificar Status de Assinatura

```typescript
import { SubscriptionManager } from '../services/subscription/SubscriptionManager'

const subscriptionManager = new SubscriptionManager()
const status = await subscriptionManager.getSubscriptionStatus(BigInt(userId))

console.log('Has Premium:', status.hasActiveSubscription)
console.log('Days Remaining:', status.daysRemaining)
```

### 2. Validar Acesso a Feature

```typescript
import { UserFactory } from '../classes/user/UserFactory'

const user = await UserFactory.createUser(BigInt(userId))
const canAccess = await user.canAccessFeature('moment_boost')

if (!canAccess) {
    throw new PaymentRequiredError({
        message: 'Boost de momentos é premium',
        action: 'Assine o Circle Premium'
    })
}
```

### 3. Rastrear Uso de Feature

```typescript
// Rastrear uso automaticamente
await user.trackFeatureUsage('posts')

// Verificar limite restante
const remaining = await user.getRemainingFeatureUsage('posts')
console.log(`Posts restantes: ${remaining}`)
```

## 🚨 Tratamento de Erros

O sistema define erros específicos:

```typescript
// PaymentRequiredError (402)
throw new PaymentRequiredError({
    message: 'Assinatura premium necessária',
    action: 'Assine o Circle Premium'
})

// ValidationError (400) 
throw new ValidationError({
    message: 'Token de compra inválido',
    action: 'Verifique os dados da compra'
})
```

## 🔒 Segurança

### 1. Verificação de Assinatura Webhook
- Validação de assinatura usando chave pública
- Rate limiting para prevenir spam
- Logs de tentativas inválidas

### 2. Validação de Tokens
- Tokens são únicos e não reutilizáveis
- Validação contra Google Play API
- Timeout de validação configurável

### 3. Proteção de Rate Limiting
- Limites diferentes para free vs premium
- Tracking por usuário e endpoint
- Burst capacity para picos de uso

## 📈 Escalabilidade

### 1. Caching
- Cache de usuários premium no UserFactory
- TTL configurável (5 minutos padrão)
- Invalidação automática em mudanças

### 2. Performance
- Índices otimizados no banco
- Paginação em endpoints de listagem
- Queries otimizadas com eager loading

### 3. Monitoring
- Métricas de success/failure rate
- Tempo de resposta da Google Play API
- Alertas para assinaturas críticas

## 🧪 Testes

Para executar os testes:

```bash
# Todos os testes
npm test

# Apenas testes de classes
npm run test:classes

# Testes específicos de premium
npm run test:premium

# Coverage
npm run test:coverage
```

## 🔄 Migração de Dados

Se você já tem usuários premium, use este script para migrar:

```sql
-- Exemplo de migração de dados existentes
INSERT INTO user_subscriptions (
    user_id, 
    purchase_token, 
    product_id, 
    order_id, 
    status, 
    purchased_at,
    expires_at,
    price_amount_micros,
    original_json
)
SELECT 
    id as user_id,
    CONCAT('migrated_', id) as purchase_token,
    'circle_premium_monthly' as product_id,
    CONCAT('ORDER_MIGRATED_', id) as order_id,
    'active' as status,
    created_at as purchased_at,
    created_at + INTERVAL '1 month' as expires_at,
    9990000 as price_amount_micros,
    '{"migrated": true}' as original_json
FROM users 
WHERE subscription_tier = 'premium';
```

## 📞 Suporte

Para issues ou dúvidas:
1. Verificar logs em `subscription_validation_logs`
2. Testar com `/api/subscription/health`
3. Validar configurações com `validateGooglePlayConfig()`
4. Consultar documentação do Google Play Billing

---

**⚠️ Importante**: Sempre teste em ambiente de desenvolvimento antes de fazer deploy em produção. Use products de teste do Google Play Console durante o desenvolvimento.
