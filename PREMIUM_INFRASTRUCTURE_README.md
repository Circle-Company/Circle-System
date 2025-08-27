# 🚀 CIRCLE SYSTEM - PREMIUM INFRASTRUCTURE IMPLEMENTATION

## 📋 **OVERVIEW**
Este documento detalha a implementação completa da infraestrutura premium para o Circle System, incluindo sistema de cobrança, validação de usuários premium e refatoração arquitetural com classes OOP.

---

## 🎯 **OBJETIVOS PRINCIPAIS**

### 1. **Sistema de Cobrança e Assinatura**
- ✅ Gateway de pagamento (Stripe + PIX/Cartão brasileiro)
- ✅ Assinaturas com renovação automática
- ✅ Trial periods e promoções
- ✅ Webhooks para sincronização de status

### 2. **Arquitetura de Classes User**
- ✅ Refatorar validações hardcoded por classes OOP
- ✅ Padrão Strategy/Template Method para tipos de usuário
- ✅ Centralização de lógica de permissões

### 3. **Middleware Premium**
- ✅ Verificação robusta de features premium
- ✅ Cache de permissões para performance
- ✅ Rate limiting diferenciado por tier

---

## 🏗️ **ARQUITETURA ATUAL vs NOVA**

### **❌ Problemas da Estrutura Atual:**
```typescript
// Controllers com validações hardcoded
export async function find_user_data(req: Request, res: Response) {
    if (!req.user_id) {  // ← HARDCODED
        throw new UnauthorizedError({...})
    }
    // Lógica específica sem considerar tier...
}

// Middlewares básicos sem informação de tier
export async function UserAuthenticationValidator(req, res, next) {
    req.user_id = decoded.sub  // ← SÓ ID, SEM SUBSCRIPTION INFO
    req.username = decoded.username
    next()
}
```

### **✅ Nova Arquitetura Proposta:**
```typescript
// Classes User com polimorfismo
abstract class BaseUser {
    abstract canAccessFeature(feature: string): Promise<boolean>
    abstract getRateLimit(endpoint: string): RateLimit
    abstract getStorageLimit(): StorageLimit
}

class PremiumUser extends BaseUser {
    async canAccessFeature(feature: string): boolean {
        return PREMIUM_FEATURES.includes(feature)
    }
}

// Controllers limpos
export async function find_user_data(req: Request, res: Response) {
    // ✅ Middleware já validou e anexou req.user (instância da classe)
    const hasAnalytics = await req.user.canAccessFeature('analytics')
    
    if (hasAnalytics) {
        data.analytics = await getAdvancedAnalytics()
    }
    
    return res.json(data)
}
```

---

## 🛠️ **IMPLEMENTAÇÃO DETALHADA**

### **1. DATABASE SCHEMA**

#### **1.1 Users Table Extensions**
```sql
-- Extensões na tabela users
ALTER TABLE users ADD COLUMN subscription_tier ENUM('free', 'premium', 'pro', 'enterprise') DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_status ENUM('active', 'canceled', 'past_due', 'trialing', 'unpaid') DEFAULT 'active';
ALTER TABLE users ADD COLUMN subscription_id VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN subscription_starts_at DATETIME NULL;
ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME NULL;
ALTER TABLE users ADD COLUMN trial_ends_at DATETIME NULL;
ALTER TABLE users ADD COLUMN subscription_canceled_at DATETIME NULL;
ALTER TABLE users ADD COLUMN last_payment_at DATETIME NULL;
ALTER TABLE users ADD COLUMN payment_method_id VARCHAR(255) NULL;
```

#### **1.2 Nova Tabela: subscription_plans**
```sql
CREATE TABLE subscription_plans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    tier ENUM('premium', 'pro', 'enterprise') NOT NULL,
    price_monthly_brl DECIMAL(10,2) NOT NULL,
    price_yearly_brl DECIMAL(10,2) NOT NULL,
    features JSON NOT NULL,
    limits_config JSON NOT NULL,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **1.3 Nova Tabela: payment_transactions**
```sql
CREATE TABLE payment_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    subscription_id VARCHAR(255),
    payment_gateway ENUM('stripe', 'pix', 'boleto', 'credit_card') NOT NULL,
    gateway_transaction_id VARCHAR(255) NOT NULL,
    amount_brl DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL,
    payment_method VARCHAR(100),
    metadata JSON,
    processed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_payment (user_id, created_at),
    INDEX idx_gateway_transaction (gateway_transaction_id)
);
```

#### **1.4 Nova Tabela: premium_feature_usage**
```sql
CREATE TABLE premium_feature_usage (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INT DEFAULT 0,
    last_used_at DATETIME NULL,
    reset_period ENUM('daily', 'monthly', 'yearly') NOT NULL,
    last_reset_at DATETIME NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_feature (user_id, feature_name),
    INDEX idx_feature_usage (feature_name, last_reset_at)
);
```

#### **1.5 Nova Tabela: moment_boosts**
```sql
CREATE TABLE moment_boosts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    moment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    boost_type ENUM('engagement', 'temporal', 'visibility') NOT NULL,
    multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    expires_at DATETIME NOT NULL,
    payment_transaction_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id),
    INDEX idx_active_boosts (expires_at, boost_type),
    INDEX idx_moment_boosts (moment_id, expires_at)
);
```

---

### **2. SISTEMA DE CLASSES USER**

#### **2.1 Base User Class**
```typescript
// src/classes/users/BaseUser.ts
export abstract class BaseUser {
    protected userData: UserData
    protected subscriptionData: SubscriptionData
    protected featureUsage: Map<string, FeatureUsage>

    constructor(userData: UserData) {
        this.userData = userData
        this.loadSubscriptionData()
        this.loadFeatureUsage()
    }

    // Métodos abstratos - devem ser implementados por subclasses
    abstract canAccessFeature(feature: string): Promise<boolean>
    abstract getRateLimit(endpoint: string): RateLimit
    abstract getStorageLimit(): StorageLimit
    abstract getMonthlyLimits(): MonthlyLimits
    abstract canBoostMoment(type: BoostType): Promise<boolean>
    abstract getPriorityLevel(): number

    // Métodos concretos compartilhados
    async trackFeatureUsage(feature: string): Promise<void> {
        await FeatureUsageService.track(this.userData.id, feature)
    }

    async isWithinUsageLimit(feature: string): Promise<boolean> {
        const usage = await FeatureUsageService.getUsage(this.userData.id, feature)
        const limit = this.getFeatureLimit(feature)
        return usage.count < limit
    }

    async getFeatureUsageStats(feature: string): Promise<FeatureUsageStats> {
        return await FeatureUsageService.getStats(this.userData.id, feature)
    }

    // Getters
    get id(): bigint { return this.userData.id }
    get username(): string { return this.userData.username }
    get subscriptionTier(): SubscriptionTier { return this.userData.subscription_tier }
    get isActive(): boolean { return this.userData.subscription_status === 'active' }
    get subscriptionExpiresAt(): Date { return this.userData.subscription_expires_at }
}
```

#### **2.2 Free User Implementation**
```typescript
// src/classes/users/FreeUser.ts
export class FreeUser extends BaseUser {
    async canAccessFeature(feature: string): Promise<boolean> {
        const freeFeatures = [
            'basic_posting',
            'basic_search', 
            'basic_profile',
            'follow_users',
            'like_comments',
            'view_moments'
        ]
        return freeFeatures.includes(feature)
    }

    getRateLimit(endpoint: string): RateLimit {
        const limits = {
            'POST /api/moments': { requests: 5, window: '1h' },
            'POST /api/users/follow': { requests: 10, window: '1h' },
            'GET /api/search': { requests: 20, window: '1h' },
            'default': { requests: 100, window: '15m' }
        }
        return limits[endpoint] || limits.default
    }

    getStorageLimit(): StorageLimit {
        return {
            totalMB: 100,
            videoDurationMax: 300, // 5 minutos
            imagesMax: 50,
            memoriesMax: 5
        }
    }

    getMonthlyLimits(): MonthlyLimits {
        return {
            posts: 30,
            likes: 100,
            comments: 50,
            follows: 20,
            searches: 100,
            profile_views: 50
        }
    }

    async canBoostMoment(type: BoostType): Promise<boolean> {
        return false // Free users não podem fazer boost
    }

    getPriorityLevel(): number {
        return 1 // Menor prioridade
    }
}
```

#### **2.3 Premium User Implementation**
```typescript
// src/classes/users/PremiumUser.ts
export class PremiumUser extends BaseUser {
    async canAccessFeature(feature: string): Promise<boolean> {
        const premiumFeatures = [
            // Features gratuitas
            'basic_posting', 'basic_search', 'basic_profile', 'follow_users', 'like_comments', 'view_moments',
            // Features premium
            'profile_highlight',
            'advanced_search',
            'moment_boost_basic',
            'analytics_basic',
            'priority_support',
            'higher_rate_limits',
            'extended_storage',
            'custom_themes',
            'badges_premium'
        ]
        return premiumFeatures.includes(feature)
    }

    getRateLimit(endpoint: string): RateLimit {
        const limits = {
            'POST /api/moments': { requests: 50, window: '1h' },
            'POST /api/users/follow': { requests: 100, window: '1h' },
            'GET /api/search': { requests: 200, window: '1h' },
            'POST /api/moments/:id/boost': { requests: 10, window: '1h' },
            'default': { requests: 500, window: '15m' }
        }
        return limits[endpoint] || limits.default
    }

    getStorageLimit(): StorageLimit {
        return {
            totalMB: 5000,  // 5GB
            videoDurationMax: 1800, // 30 minutos
            imagesMax: 500,
            memoriesMax: 50
        }
    }

    getMonthlyLimits(): MonthlyLimits {
        return {
            posts: 300,
            likes: 2000,
            comments: 500,
            follows: 200,
            searches: 1000,
            profile_views: 1000,
            boosts: 10
        }
    }

    async canBoostMoment(type: BoostType): Promise<boolean> {
        const allowedBoosts = ['engagement', 'temporal']
        return allowedBoosts.includes(type)
    }

    getPriorityLevel(): number {
        return 2 // Prioridade média
    }
}
```

#### **2.4 Pro User Implementation**
```typescript
// src/classes/users/ProUser.ts
export class ProUser extends BaseUser {
    async canAccessFeature(feature: string): Promise<boolean> {
        const proFeatures = [
            // Todas as features premium +
            'advanced_analytics',
            'creator_tools',
            'moment_boost_advanced',
            'collaboration_tools',
            'api_access',
            'white_label',
            'priority_feed_placement',
            'bulk_operations',
            'advanced_scheduling',
            'team_management'
        ]
        
        // Pro tem acesso a tudo do premium também
        const premiumUser = new PremiumUser(this.userData)
        const hasPremiumAccess = await premiumUser.canAccessFeature(feature)
        
        return hasPremiumAccess || proFeatures.includes(feature)
    }

    getRateLimit(endpoint: string): RateLimit {
        const limits = {
            'POST /api/moments': { requests: 500, window: '1h' },
            'POST /api/users/follow': { requests: 1000, window: '1h' },
            'GET /api/search': { requests: 2000, window: '1h' },
            'POST /api/moments/:id/boost': { requests: 50, window: '1h' },
            'GET /api/analytics': { requests: 100, window: '1h' },
            'default': { requests: 2000, window: '15m' }
        }
        return limits[endpoint] || limits.default
    }

    getStorageLimit(): StorageLimit {
        return {
            totalMB: 50000, // 50GB
            videoDurationMax: 7200, // 2 horas
            imagesMax: 5000,
            memoriesMax: 500
        }
    }

    getMonthlyLimits(): MonthlyLimits {
        return {
            posts: 3000,
            likes: 20000,
            comments: 5000,
            follows: 2000,
            searches: 10000,
            profile_views: 10000,
            boosts: 100,
            api_calls: 100000
        }
    }

    async canBoostMoment(type: BoostType): Promise<boolean> {
        return true // Pro pode fazer qualquer tipo de boost
    }

    getPriorityLevel(): number {
        return 3 // Prioridade alta
    }
}
```

#### **2.5 User Factory**
```typescript
// src/classes/users/UserFactory.ts
export class UserFactory {
    private static userCache = new Map<bigint, BaseUser>()
    private static cacheTimeout = 5 * 60 * 1000 // 5 minutos

    static async createUser(userId: bigint): Promise<BaseUser> {
        // Verificar cache primeiro
        const cached = this.userCache.get(userId)
        if (cached) {
            return cached
        }

        const userData = await this.loadUserData(userId)
        let user: BaseUser

        switch (userData.subscription_tier) {
            case 'free':
                user = new FreeUser(userData)
                break
            case 'premium':
                user = new PremiumUser(userData)
                break
            case 'pro':
                user = new ProUser(userData)
                break
            case 'enterprise':
                user = new EnterpriseUser(userData)
                break
            default:
                throw new Error(`Unknown subscription tier: ${userData.subscription_tier}`)
        }

        // Cache o usuário
        this.userCache.set(userId, user)
        setTimeout(() => {
            this.userCache.delete(userId)
        }, this.cacheTimeout)

        return user
    }

    private static async loadUserData(userId: bigint): Promise<UserData> {
        const user = await User.findOne({
            where: { id: userId },
            include: [
                { model: Statistic, as: 'statistics' },
                { model: Preference, as: 'preferences' }
            ]
        })
        
        if (!user) {
            throw new NotFoundError({ message: 'User not found' })
        }
        
        return user
    }

    static clearCache(userId?: bigint) {
        if (userId) {
            this.userCache.delete(userId)
        } else {
            this.userCache.clear()
        }
    }
}
```

---

### **3. MIDDLEWARE PREMIUM SYSTEM**

#### **3.1 Enhanced Authentication Middleware**
```typescript
// src/middlewares/EnhancedAuthenticationValidator.ts
export async function EnhancedAuthenticationValidator(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Validação JWT padrão
        const authHeader = req.headers.authorization
        if (!authHeader) {
            return next(new UnauthorizedError({
                message: "Access denied: Missing authorization token."
            }))
        }

        const [scheme, token] = authHeader.split(" ")
        if (!token || scheme !== "Bearer") {
            return next(new UnauthorizedError({
                message: "Access denied: Invalid authorization format."
            }))
        }

        const decoded = jwt.decode(token, CONFIG.JWT_SECRET, false, "HS256")
        
        // Verificar expiração
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            return next(new UnauthorizedError({
                message: "Access denied: Token has expired."
            }))
        }

        // NOVO: Criar instância do usuário através do factory
        const user = await UserFactory.createUser(BigInt(decoded.sub))
        
        // Verificar se assinatura ainda está ativa
        if (!user.isActive && user.subscriptionTier !== 'free') {
            return next(new PaymentRequiredError({
                message: "Subscription expired or payment required",
                action: "Please update your payment method or renew subscription",
                renewal_url: "/premium/renew"
            }))
        }

        // Anexar usuário completo ao request
        req.user = user
        req.user_id = user.id
        req.username = user.username
        
        next()
    } catch (err: any) {
        next(new UnauthorizedError({
            message: `Access denied: ${err.message}`
        }))
    }
}
```

#### **3.2 Feature Access Middleware**
```typescript
// src/middlewares/FeatureAccessValidator.ts
export function RequireFeature(featureName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(new UnauthorizedError({
                    message: "Authentication required"
                }))
            }

            const hasAccess = await req.user.canAccessFeature(featureName)
            
            if (!hasAccess) {
                // Rastrear tentativa de acesso a feature premium
                await AnalyticsService.trackFeatureAttempt({
                    userId: req.user.id,
                    feature: featureName,
                    subscriptionTier: req.user.subscriptionTier,
                    timestamp: new Date()
                })

                return res.status(402).json({
                    error: 'Premium feature required',
                    feature: featureName,
                    current_tier: req.user.subscriptionTier,
                    required_tier: getRequiredTierForFeature(featureName),
                    upgrade_url: `/premium/upgrade?feature=${featureName}`,
                    benefits: getFeatureBenefits(featureName),
                    pricing: await PricingService.getUpgradeOptions(req.user.subscriptionTier)
                })
            }

            // Rastrear uso da feature
            await req.user.trackFeatureUsage(featureName)
            
            next()
        } catch (err: any) {
            next(new InternalServerError({
                message: `Feature validation failed: ${err.message}`
            }))
        }
    }
}
```

#### **3.3 Usage Limit Middleware**
```typescript
// src/middlewares/UsageLimitValidator.ts
export function CheckUsageLimit(featureName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const withinLimit = await req.user.isWithinUsageLimit(featureName)
            
            if (!withinLimit) {
                const usage = await req.user.getFeatureUsageStats(featureName)
                
                return res.status(429).json({
                    error: 'Usage limit exceeded',
                    feature: featureName,
                    current_usage: usage.current,
                    limit: usage.limit,
                    reset_date: usage.resetDate,
                    upgrade_suggestion: {
                        message: "Upgrade for higher limits",
                        current_tier: req.user.subscriptionTier,
                        suggested_tier: getSuggestedUpgrade(req.user.subscriptionTier),
                        upgrade_url: "/premium/upgrade",
                        new_limit: getUpgradedLimit(featureName, req.user.subscriptionTier)
                    }
                })
            }
            
            next()
        } catch (err: any) {
            next(new InternalServerError({
                message: `Usage limit check failed: ${err.message}`
            }))
        }
    }
}
```

#### **3.4 Tiered Rate Limiting**
```typescript
// src/middlewares/TieredRateLimit.ts
export function TieredRateLimit(endpoint: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next() // Deixar para outro middleware tratar
            }

            const rateLimit = req.user.getRateLimit(endpoint)
            const key = `rate_limit:${req.user.id}:${endpoint}`
            
            const current = await RedisService.get(key) || 0
            
            if (current >= rateLimit.requests) {
                const resetIn = await RedisService.ttl(key)
                
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    limit: rateLimit.requests,
                    window: rateLimit.window,
                    reset_in_seconds: resetIn,
                    current_tier: req.user.subscriptionTier,
                    upgrade_message: req.user.subscriptionTier === 'free' 
                        ? {
                            message: "Upgrade to premium for 5x higher rate limits",
                            premium_limit: new PremiumUser(req.user.userData).getRateLimit(endpoint),
                            upgrade_url: "/premium/upgrade"
                          }
                        : undefined
                })
            }

            // Incrementar contador
            await RedisService.multi()
                .incr(key)
                .expire(key, parseWindowToSeconds(rateLimit.window))
                .exec()
            
            next()
        } catch (err: any) {
            next(new InternalServerError({
                message: `Rate limiting failed: ${err.message}`
            }))
        }
    }
}
```

---

### **4. PAYMENT SYSTEM**

#### **4.1 Stripe Integration**
```typescript
// src/services/payment/StripeService.ts
export class StripeService {
    private stripe: Stripe

    constructor() {
        this.stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16'
        })
    }

    async createSubscription(
        userId: bigint,
        planId: string,
        paymentMethodId: string,
        billingCycle: 'monthly' | 'yearly' = 'monthly'
    ): Promise<SubscriptionResult> {
        try {
            // Obter usuário e plano
            const user = await UserFactory.createUser(userId)
            const plan = await SubscriptionPlan.findByPk(planId)
            
            if (!plan) {
                throw new ValidationError({ message: 'Invalid plan selected' })
            }

            // Criar/obter customer no Stripe
            let customer = await this.getStripeCustomer(user.id)
            if (!customer) {
                customer = await this.stripe.customers.create({
                    email: user.userData.email,
                    name: user.userData.name,
                    metadata: {
                        user_id: user.id.toString(),
                        username: user.username
                    }
                })
            }
            
            // Anexar método de pagamento
            await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customer.id
            })

            // Definir preço baseado no ciclo
            const priceId = billingCycle === 'yearly' 
                ? plan.stripe_price_id_yearly 
                : plan.stripe_price_id_monthly

            // Criar assinatura
            const subscription = await this.stripe.subscriptions.create({
                customer: customer.id,
                items: [{ price: priceId }],
                default_payment_method: paymentMethodId,
                expand: ['latest_invoice.payment_intent'],
                trial_period_days: user.subscriptionTier === 'free' ? 7 : undefined, // Trial de 7 dias para novos usuários
                metadata: {
                    user_id: user.id.toString(),
                    plan_id: planId,
                    billing_cycle: billingCycle
                }
            })

            // Atualizar dados do usuário
            await this.updateUserSubscription(user.id, subscription, plan)

            return {
                subscriptionId: subscription.id,
                status: subscription.status,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
                trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
            }
        } catch (error) {
            throw new PaymentError({
                message: `Subscription creation failed: ${error.message}`
            })
        }
    }

    async handleWebhook(payload: string, signature: string): Promise<void> {
        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                CONFIG.STRIPE_WEBHOOK_SECRET
            )

            console.log(`Received Stripe webhook: ${event.type}`)

            switch (event.type) {
                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event.data.object)
                    break
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object)
                    break
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCanceled(event.data.object)
                    break
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object)
                    break
                case 'customer.subscription.trial_will_end':
                    await this.handleTrialWillEnd(event.data.object)
                    break
                default:
                    console.log(`Unhandled event type: ${event.type}`)
            }
        } catch (error) {
            throw new WebhookError({
                message: `Webhook processing failed: ${error.message}`
            })
        }
    }

    private async handlePaymentSucceeded(invoice: any): Promise<void> {
        const userId = BigInt(invoice.subscription_metadata?.user_id)
        if (!userId) return

        // Atualizar status da assinatura
        await User.update({
            subscription_status: 'active',
            last_payment_at: new Date()
        }, {
            where: { id: userId }
        })

        // Registrar transação
        await PaymentTransaction.create({
            user_id: userId,
            subscription_id: invoice.subscription,
            payment_gateway: 'stripe',
            gateway_transaction_id: invoice.payment_intent,
            amount_brl: invoice.amount_paid / 100, // Stripe usa centavos
            status: 'completed',
            payment_method: 'credit_card',
            processed_at: new Date()
        })

        // Invalidar cache do usuário
        UserFactory.clearCache(userId)

        // Enviar notificação de sucesso
        await NotificationService.sendPaymentSuccess(userId, {
            amount: invoice.amount_paid / 100,
            plan: invoice.subscription_metadata?.plan_id
        })
    }

    private async handlePaymentFailed(invoice: any): Promise<void> {
        const userId = BigInt(invoice.subscription_metadata?.user_id)
        if (!userId) return

        // Atualizar status para past_due
        await User.update({
            subscription_status: 'past_due'
        }, {
            where: { id: userId }
        })

        // Registrar transação falha
        await PaymentTransaction.create({
            user_id: userId,
            subscription_id: invoice.subscription,
            payment_gateway: 'stripe',
            gateway_transaction_id: invoice.payment_intent,
            amount_brl: invoice.amount_due / 100,
            status: 'failed',
            processed_at: new Date()
        })

        // Invalidar cache e enviar notificação
        UserFactory.clearCache(userId)
        await NotificationService.sendPaymentFailed(userId)
    }
}
```

#### **4.2 Brazilian Payment Methods**
```typescript
// src/services/payment/BrazilianPaymentService.ts
export class BrazilianPaymentService {
    async createPixPayment(
        userId: bigint,
        planId: string,
        billingCycle: 'monthly' | 'yearly' = 'monthly'
    ): Promise<PixPaymentResult> {
        try {
            const plan = await SubscriptionPlan.findByPk(planId)
            const amount = billingCycle === 'yearly' ? plan.price_yearly_brl : plan.price_monthly_brl

            // Integração com gateway brasileiro (ex: Mercado Pago)
            const payment = await this.pixGateway.createPayment({
                transaction_amount: amount,
                description: `Circle ${plan.name} - ${billingCycle}`,
                payment_method_id: 'pix',
                external_reference: `user_${userId}_plan_${planId}_${Date.now()}`,
                notification_url: `${CONFIG.BASE_URL}/webhooks/mercadopago`,
                payer: {
                    email: await this.getUserEmail(userId)
                }
            })

            // Salvar transação pendente
            await PaymentTransaction.create({
                user_id: userId,
                payment_gateway: 'pix',
                gateway_transaction_id: payment.id.toString(),
                amount_brl: amount,
                status: 'pending',
                metadata: {
                    plan_id: planId,
                    billing_cycle: billingCycle,
                    qr_code: payment.point_of_interaction.transaction_data.qr_code,
                    qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64
                }
            })

            return {
                paymentId: payment.id.toString(),
                pixCode: payment.point_of_interaction.transaction_data.qr_code,
                qrCodeImage: payment.point_of_interaction.transaction_data.qr_code_base64,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
                amount: amount
            }
        } catch (error) {
            throw new PaymentError({
                message: `PIX payment creation failed: ${error.message}`
            })
        }
    }

    async handlePixWebhook(payload: any): Promise<void> {
        try {
            const paymentId = payload.data?.id
            if (!paymentId) return

            // Buscar detalhes do pagamento
            const payment = await this.pixGateway.getPayment(paymentId)
            
            if (payment.status === 'approved') {
                // Buscar transação no nosso banco
                const transaction = await PaymentTransaction.findOne({
                    where: { gateway_transaction_id: paymentId.toString() }
                })

                if (transaction && transaction.status === 'pending') {
                    // Atualizar transação
                    await transaction.update({
                        status: 'completed',
                        processed_at: new Date()
                    })

                    // Ativar assinatura
                    const plan = await SubscriptionPlan.findByPk(transaction.metadata.plan_id)
                    const expiresAt = new Date()
                    
                    if (transaction.metadata.billing_cycle === 'yearly') {
                        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
                    } else {
                        expiresAt.setMonth(expiresAt.getMonth() + 1)
                    }

                    await User.update({
                        subscription_tier: plan.tier,
                        subscription_status: 'active',
                        subscription_starts_at: new Date(),
                        subscription_expires_at: expiresAt,
                        last_payment_at: new Date()
                    }, {
                        where: { id: transaction.user_id }
                    })

                    // Invalidar cache e notificar
                    UserFactory.clearCache(transaction.user_id)
                    await NotificationService.sendSubscriptionActivated(transaction.user_id, plan)
                }
            }
        } catch (error) {
            console.error('PIX webhook error:', error)
        }
    }
}
```

---

### **5. REFATORAÇÃO DE CONTROLLERS**

#### **5.1 User Controller Refatorado**
```typescript
// src/controllers/user/user-find-controller.ts (REFATORADO)
export const find_user_data = [
    EnhancedAuthenticationValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.params
            
            // ✅ req.user já é uma instância da classe apropriada
            const hasAnalyticsAccess = await req.user.canAccessFeature('user_analytics')
            const hasAdvancedStats = await req.user.canAccessFeature('advanced_analytics')
            
            // Buscar dados básicos
            const userData = await UserService.UserFind.FindAllData({ 
                username, 
                user_id: req.user.id 
            })
            
            // ✅ Dados condicionais baseados na assinatura
            const response = {
                ...userData,
                subscription_info: {
                    tier: req.user.subscriptionTier,
                    status: req.user.isActive ? 'active' : 'inactive',
                    expires_at: req.user.subscriptionExpiresAt
                }
            }
            
            // Adicionar analytics se tiver acesso
            if (hasAnalyticsAccess) {
                response.analytics = await AnalyticsService.getBasicAnalytics(req.user.id)
            }
            
            if (hasAdvancedStats) {
                response.advanced_analytics = await AnalyticsService.getAdvancedAnalytics(req.user.id)
                response.revenue_stats = await AnalyticsService.getRevenueStats(req.user.id)
            }
            
            return res.status(200).json(response)
        } catch (err: unknown) {
            next(err)
        }
    }
]
```

#### **5.2 Moment Controller com Boost**
```typescript
// src/controllers/moment/moment-boost-controller.ts (NOVO)
export const boost_moment = [
    EnhancedAuthenticationValidator,
    RequireFeature('moment_boost'),
    CheckUsageLimit('moment_boost_daily'),
    TieredRateLimit('POST /api/moments/:id/boost'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { moment_id } = req.params
            const { boost_type, duration } = req.body
            
            // ✅ Verificação específica do tipo de boost usando classe
            const canBoost = await req.user.canBoostMoment(boost_type)
            if (!canBoost) {
                return res.status(402).json({
                    error: 'Boost type not available in your plan',
                    current_tier: req.user.subscriptionTier,
                    available_boost_types: await BoostService.getAvailableBoostTypes(req.user.subscriptionTier),
                    upgrade_url: '/premium/upgrade?feature=advanced_boost'
                })
            }
            
            // Verificar se momento pertence ao usuário
            const moment = await Moment.findOne({
                where: { id: moment_id, user_id: req.user.id }
            })
            
            if (!moment) {
                return res.status(404).json({
                    error: 'Moment not found or not owned by user'
                })
            }
            
            // Calcular preço com desconto baseado no tier
            const pricing = await BoostService.calculatePrice(
                moment_id, 
                boost_type, 
                duration,
                req.user.subscriptionTier
            )
            
            // Processar pagamento instantâneo (para boosts)
            const payment = await PaymentService.processBoostPayment(
                req.user.id,
                pricing
            )
            
            if (payment.status === 'completed') {
                // Ativar boost
                const boost = await BoostService.activateBoost({
                    moment_id: BigInt(moment_id),
                    user_id: req.user.id,
                    boost_type,
                    duration,
                    payment_id: payment.id,
                    multiplier: pricing.multiplier
                })
                
                // Rastrear uso da feature
                await req.user.trackFeatureUsage('moment_boost')
                
                return res.status(200).json({
                    message: 'Boost activated successfully',
                    boost_info: {
                        id: boost.id,
                        type: boost_type,
                        multiplier: pricing.multiplier,
                        expires_at: boost.expires_at,
                        cost: pricing.final_price,
                        discount_applied: pricing.discount_percentage
                    },
                    analytics_url: `/analytics/boost/${boost.id}`
                })
            } else {
                return res.status(402).json({
                    error: 'Payment failed',
                    payment_status: payment.status,
                    retry_url: `/payment/retry/${payment.id}`
                })
            }
            
        } catch (err: any) {
            next(err)
        }
    }
]

// Endpoint para listar boosts ativos
export const list_active_boosts = [
    EnhancedAuthenticationValidator,
    RequireFeature('moment_boost'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const activeBoosts = await MomentBoost.findAll({
                where: {
                    user_id: req.user.id,
                    expires_at: { [Op.gt]: new Date() }
                },
                include: [{
                    model: Moment,
                    as: 'moment',
                    attributes: ['id', 'description', 'created_at']
                }],
                order: [['expires_at', 'DESC']]
            })
            
            const boostsWithAnalytics = await Promise.all(
                activeBoosts.map(async (boost) => ({
                    ...boost.toJSON(),
                    analytics: await BoostAnalyticsService.getBoostStats(boost.id)
                }))
            )
            
            return res.status(200).json({
                active_boosts: boostsWithAnalytics,
                total_spent_this_month: await BoostService.getTotalSpentThisMonth(req.user.id),
                available_boost_types: await BoostService.getAvailableBoostTypes(req.user.subscriptionTier)
            })
        } catch (err: any) {
            next(err)
        }
    }
]
```

#### **5.3 Search Controller com Priority**
```typescript
// src/controllers/search/search-controller.ts (REFATORADO)
export const search_users = [
    EnhancedAuthenticationValidator,
    TieredRateLimit('GET /api/search'),
    CheckUsageLimit('searches'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { searchTerm, filters } = req.body
            
            // ✅ Busca básica vs avançada baseada no tier
            const hasAdvancedSearch = await req.user.canAccessFeature('advanced_search')
            
            let searchOptions = {
                term: searchTerm,
                user_id: req.user.id,
                limit: 20
            }
            
            if (hasAdvancedSearch && filters) {
                searchOptions = {
                    ...searchOptions,
                    filters: {
                        location: filters.location,
                        interests: filters.interests,
                        follower_range: filters.follower_range,
                        verified_only: filters.verified_only,
                        last_active: filters.last_active
                    },
                    limit: 50 // Premium tem mais resultados
                }
            }
            
            // ✅ Adicionar peso premium na busca
            searchOptions.premium_boost = req.user.getPriorityLevel()
            
            const results = await SearchService.searchUsers(searchOptions)
            
            // Rastrear uso
            await req.user.trackFeatureUsage('search')
            
            return res.status(200).json({
                results: results,
                search_type: hasAdvancedSearch ? 'advanced' : 'basic',
                remaining_searches: await req.user.getRemainingUsage('searches'),
                upgrade_suggestion: !hasAdvancedSearch ? {
                    message: "Upgrade to premium for advanced filters",
                    features: ['Location filter', 'Interest matching', 'Verified users only', '50+ results'],
                    upgrade_url: '/premium/upgrade?feature=advanced_search'
                } : null
            })
        } catch (err: any) {
            next(err)
        }
    }
]
```

---

### **6. CONFIGURAÇÃO E PRICING**

#### **6.1 Feature Configuration**
```typescript
// src/config/features.ts
export const FEATURE_CONFIG = {
    FREE_FEATURES: [
        'basic_posting',
        'basic_search', 
        'basic_profile',
        'follow_users',
        'like_comments',
        'view_moments',
        'basic_notifications'
    ],

    PREMIUM_FEATURES: [
        'profile_highlight',
        'advanced_search',
        'moment_boost_basic',
        'analytics_basic',
        'priority_support',
        'higher_rate_limits',
        'extended_storage',
        'custom_themes',
        'badges_premium',
        'priority_notifications'
    ],

    PRO_FEATURES: [
        'advanced_analytics',
        'creator_tools',
        'moment_boost_advanced',
        'collaboration_tools',
        'api_access',
        'white_label',
        'priority_feed_placement',
        'bulk_operations',
        'advanced_scheduling',
        'team_management'
    ],

    TIER_LIMITS: {
        free: {
            posts_per_day: 5,
            likes_per_hour: 20,
            follows_per_day: 10,
            searches_per_hour: 10,
            storage_mb: 100,
            video_duration_seconds: 300,
            memories_max: 5,
            profile_views_per_day: 50
        },
        premium: {
            posts_per_day: 50,
            likes_per_hour: 200,
            follows_per_day: 100,
            searches_per_hour: 100,
            storage_mb: 5000,
            video_duration_seconds: 1800,
            memories_max: 50,
            profile_views_per_day: 1000,
            boosts_per_month: 10
        },
        pro: {
            posts_per_day: 500,
            likes_per_hour: 2000,
            follows_per_day: 1000,
            searches_per_hour: 1000,
            storage_mb: 50000,
            video_duration_seconds: 7200,
            memories_max: 500,
            profile_views_per_day: 10000,
            boosts_per_month: 100,
            api_calls_per_hour: 1000
        }
    }
}
```

#### **6.2 Pricing Configuration**
```typescript
// src/config/pricing.ts
export const PRICING_CONFIG = {
    PLANS: {
        premium: {
            id: 'premium',
            name: 'Circle Premium',
            monthly_brl: 14.90,
            yearly_brl: 149.90, // ~2 meses grátis
            features: FEATURE_CONFIG.PREMIUM_FEATURES,
            limits: FEATURE_CONFIG.TIER_LIMITS.premium,
            stripe_price_id_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
            stripe_price_id_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
            trial_days: 7,
            popular: true
        },
        pro: {
            id: 'pro',
            name: 'Circle Pro',
            monthly_brl: 49.90,
            yearly_brl: 499.90, // ~2 meses grátis
            features: [...FEATURE_CONFIG.PREMIUM_FEATURES, ...FEATURE_CONFIG.PRO_FEATURES],
            limits: FEATURE_CONFIG.TIER_LIMITS.pro,
            stripe_price_id_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
            stripe_price_id_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
            trial_days: 14,
            recommended_for: 'creators'
        }
    },

    BOOST_PRICING: {
        engagement: {
            name: 'Engagement Boost',
            description: 'Increase likes and comments',
            options: {
                '1h': { price_brl: 2.99, multiplier: 2.0, label: 'Quick Boost' },
                '6h': { price_brl: 7.99, multiplier: 3.0, label: 'Power Boost' },
                '24h': { price_brl: 19.99, multiplier: 5.0, label: 'Mega Boost' }
            }
        },
        temporal: {
            name: 'Priority Placement',
            description: 'Appear first in feeds',
            options: {
                '1h': { price_brl: 4.99, priority: 'high', label: 'Rush Hour' },
                '6h': { price_brl: 12.99, priority: 'highest', label: 'Prime Time' }
            }
        },
        visibility: {
            name: 'Reach Expansion',
            description: 'Show to more users',
            options: {
                '24h': { price_brl: 29.99, multiplier: 10.0, label: 'Viral Push' },
                '72h': { price_brl: 59.99, multiplier: 15.0, label: 'Trending Wave' }
            }
        }
    },

    DISCOUNTS: {
        tier_based: {
            premium: 0.15, // 15% off boosts
            pro: 0.25      // 25% off boosts
        },
        first_boost: 0.50,        // 50% off first boost
        bulk_discounts: {
            5: 0.10,  // 10% off when buying 5+ boosts
            10: 0.20, // 20% off when buying 10+ boosts
            20: 0.30  // 30% off when buying 20+ boosts
        },
        seasonal: {
            // Configurável via admin
            black_friday: { percentage: 0.40, starts: '2024-11-25', ends: '2024-11-30' },
            new_year: { percentage: 0.25, starts: '2024-12-26', ends: '2024-01-05' }
        }
    }
}
```

---

### **7. ANALYTICS E MONITORING**

#### **7.1 Analytics Service**
```typescript
// src/services/AnalyticsService.ts
export class AnalyticsService {
    static async trackFeatureAttempt(data: FeatureAttemptEvent) {
        await FeatureAttempt.create({
            user_id: data.userId,
            feature_name: data.feature,
            subscription_tier: data.subscriptionTier,
            success: false,
            timestamp: data.timestamp
        })
        
        // Enviar para serviço externo (Mixpanel, Amplitude, etc)
        await this.sendToExternalAnalytics('feature_attempt_blocked', {
            user_id: data.userId.toString(),
            feature: data.feature,
            tier: data.subscriptionTier,
            conversion_opportunity: true
        })
    }
    
    static async trackSubscriptionEvent(event: SubscriptionEvent) {
        await SubscriptionEvent.create(event)
        
        // Métricas para dashboard administrativo
        await this.updateSubscriptionMetrics(event)
    }
    
    static async getConversionFunnel(period: 'day' | 'week' | 'month' = 'month') {
        const startDate = this.getStartDate(period)
        
        const funnel = await FeatureAttempt.findAll({
            where: {
                timestamp: { [Op.gte]: startDate }
            },
            group: ['feature_name', 'subscription_tier'],
            attributes: [
                'feature_name',
                'subscription_tier',
                [fn('COUNT', col('id')), 'attempts'],
                [fn('COUNT', where(col('converted'), true)), 'conversions']
            ]
        })
        
        return funnel.map(item => ({
            feature: item.feature_name,
            tier: item.subscription_tier,
            attempts: item.attempts,
            conversions: item.conversions,
            conversion_rate: (item.conversions / item.attempts) * 100
        }))
    }
    
    static async getRevenueMetrics(period: 'day' | 'week' | 'month' = 'month') {
        const startDate = this.getStartDate(period)
        
        const revenue = await PaymentTransaction.findAll({
            where: {
                status: 'completed',
                processed_at: { [Op.gte]: startDate }
            },
            group: ['payment_gateway'],
            attributes: [
                'payment_gateway',
                [fn('SUM', col('amount_brl')), 'total_revenue'],
                [fn('COUNT', col('id')), 'transaction_count'],
                [fn('AVG', col('amount_brl')), 'average_transaction']
            ]
        })
        
        return revenue
    }
}
```

---

### **8. TESTING STRATEGY**

#### **8.1 Unit Tests Examples**
```typescript
// src/tests/classes/users/PremiumUser.test.ts
describe('PremiumUser', () => {
    let premiumUser: PremiumUser
    let mockUserData: UserData
    
    beforeEach(() => {
        mockUserData = {
            id: BigInt(123),
            username: 'testuser',
            subscription_tier: 'premium',
            subscription_status: 'active',
            subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
        premiumUser = new PremiumUser(mockUserData)
    })
    
    describe('canAccessFeature', () => {
        test('should allow premium features', async () => {
            expect(await premiumUser.canAccessFeature('profile_highlight')).toBe(true)
            expect(await premiumUser.canAccessFeature('advanced_search')).toBe(true)
            expect(await premiumUser.canAccessFeature('moment_boost_basic')).toBe(true)
        })
        
        test('should not allow pro-only features', async () => {
            expect(await premiumUser.canAccessFeature('api_access')).toBe(false)
            expect(await premiumUser.canAccessFeature('white_label')).toBe(false)
        })
        
        test('should allow basic features', async () => {
            expect(await premiumUser.canAccessFeature('basic_posting')).toBe(true)
            expect(await premiumUser.canAccessFeature('follow_users')).toBe(true)
        })
    })
    
    describe('getRateLimit', () => {
        test('should return higher limits than free users', () => {
            const freeUser = new FreeUser(mockUserData)
            const premiumLimit = premiumUser.getRateLimit('POST /api/moments')
            const freeLimit = freeUser.getRateLimit('POST /api/moments')
            
            expect(premiumLimit.requests).toBeGreaterThan(freeLimit.requests)
        })
    })
    
    describe('canBoostMoment', () => {
        test('should allow basic boost types', async () => {
            expect(await premiumUser.canBoostMoment('engagement')).toBe(true)
            expect(await premiumUser.canBoostMoment('temporal')).toBe(true)
        })
        
        test('should not allow advanced boost types', async () => {
            expect(await premiumUser.canBoostMoment('visibility')).toBe(false)
        })
    })
})

// src/tests/middlewares/FeatureAccessValidator.test.ts
describe('FeatureAccessValidator', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: jest.MockedFunction<NextFunction>
    
    beforeEach(() => {
        req = {}
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        }
        next = jest.fn()
    })
    
    test('should allow premium user to access premium feature', async () => {
        req.user = new PremiumUser(mockPremiumUserData)
        const middleware = RequireFeature('profile_highlight')
        
        await middleware(req as Request, res as Response, next)
        
        expect(next).toHaveBeenCalledWith()
        expect(res.status).not.toHaveBeenCalled()
    })
    
    test('should block free user from premium feature', async () => {
        req.user = new FreeUser(mockFreeUserData)
        const middleware = RequireFeature('profile_highlight')
        
        await middleware(req as Request, res as Response, next)
        
        expect(res.status).toHaveBeenCalledWith(402)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: 'Premium feature required',
                feature: 'profile_highlight'
            })
        )
    })
})
```

#### **8.2 Integration Tests**
```typescript
// src/tests/integration/subscription-flow.test.ts
describe('Subscription Flow', () => {
    test('should upgrade user to premium after Stripe payment', async () => {
        const userId = BigInt(123)
        
        // Simular webhook de pagamento bem-sucedido
        const stripeEvent = {
            type: 'invoice.payment_succeeded',
            data: {
                object: {
                    subscription: 'sub_123',
                    amount_paid: 1490, // R$ 14.90 em centavos
                    subscription_metadata: {
                        user_id: userId.toString(),
                        plan_id: 'premium'
                    }
                }
            }
        }
        
        const response = await request(app)
            .post('/webhooks/stripe')
            .set('stripe-signature', 'valid_signature')
            .send(stripeEvent)
            
        expect(response.status).toBe(200)
        
        // Verificar se usuário foi atualizado
        const user = await UserFactory.createUser(userId)
        expect(user.subscriptionTier).toBe('premium')
        expect(user.isActive).toBe(true)
    })
    
    test('should handle failed payment correctly', async () => {
        const userId = BigInt(456)
        
        const stripeEvent = {
            type: 'invoice.payment_failed',
            data: {
                object: {
                    subscription: 'sub_456',
                    subscription_metadata: {
                        user_id: userId.toString()
                    }
                }
            }
        }
        
        await request(app)
            .post('/webhooks/stripe')
            .set('stripe-signature', 'valid_signature')
            .send(stripeEvent)
        
        const user = await User.findByPk(userId)
        expect(user.subscription_status).toBe('past_due')
    })
})

// src/tests/integration/boost-system.test.ts
describe('Boost System', () => {
    test('should allow premium user to boost moment', async () => {
        const premiumUser = await createTestUser('premium')
        const moment = await createTestMoment(premiumUser.id)
        
        const response = await request(app)
            .post(`/api/moments/${moment.id}/boost`)
            .set('Authorization', `Bearer ${premiumUser.token}`)
            .send({
                boost_type: 'engagement',
                duration: '1h'
            })
        
        expect(response.status).toBe(200)
        expect(response.body.boost_info).toBeDefined()
        expect(response.body.boost_info.type).toBe('engagement')
    })
    
    test('should reject free user boost attempt', async () => {
        const freeUser = await createTestUser('free')
        const moment = await createTestMoment(freeUser.id)
        
        const response = await request(app)
            .post(`/api/moments/${moment.id}/boost`)
            .set('Authorization', `Bearer ${freeUser.token}`)
            .send({
                boost_type: 'engagement',
                duration: '1h'
            })
        
        expect(response.status).toBe(402)
        expect(response.body.error).toBe('Premium feature required')
    })
})
```

---

## 🚧 **IMPLEMENTATION ROADMAP**

### **Sprint 1: Foundation (Week 1)**
- ✅ Database migrations
- ✅ Base User classes implementation  
- ✅ UserFactory
- ✅ Enhanced authentication middleware
- ✅ Basic feature configuration

### **Sprint 2: Payment Integration (Week 2)**
- ✅ Stripe service integration
- ✅ Brazilian payment methods (PIX/Boleto)
- ✅ Webhook handlers
- ✅ Payment transaction tracking
- ✅ Subscription management

### **Sprint 3: Feature Gates & Middlewares (Week 3)**
- ✅ Feature access middleware
- ✅ Usage limit tracking
- ✅ Tiered rate limiting
- ✅ Controller refactoring (users, search)
- ✅ Analytics foundation

### **Sprint 4: Boost System (Week 4)**
- ✅ Boost controllers and services
- ✅ Swipe-engine integration
- ✅ Boost analytics
- ✅ Pricing and discount system
- ✅ Admin dashboard basics

### **Sprint 5: Testing & Polish (Week 5)**
- ✅ Comprehensive test suite
- ✅ Performance optimization
- ✅ Security audit
- ✅ Documentation completion
- ✅ Production deployment

---

## 📊 **SUCCESS METRICS**

### **Technical Metrics**
- ✅ 99.9% uptime for payment system
- ✅ <200ms response time for feature validation
- ✅ Zero false positives in feature access
- ✅ <5% failed payment rate

### **Business Metrics**
- 🎯 5% free → premium conversion rate (month 1)
- 🎯 15% free → premium conversion rate (month 6)
- 🎯 R$ 50,000 MRR (month 6)
- 🎯 <5% monthly churn rate
- 🎯 15% boost feature adoption (premium users)

### **User Experience Metrics**
- 🎯 <3 clicks to upgrade
- 🎯 <30 seconds payment completion time
- 🎯 90%+ satisfaction rating for premium features
- 🎯 <1% support tickets related to billing

---

## 🔒 **SECURITY & COMPLIANCE**

### **Payment Security**
- ✅ PCI DSS compliance via Stripe
- ✅ No credit card data storage
- ✅ Webhook signature verification
- ✅ Rate limiting on payment endpoints
- ✅ Fraud detection integration

### **Data Privacy (LGPD)**
- ✅ Subscription data encryption
- ✅ Right to data portability
- ✅ Right to deletion
- ✅ Transparent billing information
- ✅ Audit logs for premium features

### **API Security**
- ✅ Feature access validation on every request
- ✅ JWT token expiry handling
- ✅ Rate limiting per tier
- ✅ Request/response logging
- ✅ Error message sanitization

---

## 📚 **DOCUMENTATION DELIVERABLES**

1. **API Documentation**
   - OpenAPI/Swagger specs for all endpoints
   - Authentication examples with tiers
   - Error response documentation
   - Webhook payload examples

2. **Developer Documentation**
   - Architecture decision records
   - Database schema documentation
   - Deployment procedures
   - Monitoring and alerting setup

3. **Business Documentation**
   - Feature comparison matrix
   - Pricing strategy documentation
   - User upgrade flow
   - Cancellation and refund policies

---

## 🚀 **NEXT STEPS**

1. **Review and approve** this implementation plan
2. **Set up development environment** with Stripe test keys
3. **Create development/staging databases** with new schema
4. **Begin Sprint 1** implementation
5. **Set up monitoring** and analytics infrastructure

---

Este documento serve como blueprint completo para implementar a infraestrutura premium do Circle System de forma escalável e robusta. Cada componente foi pensado para ser mantível, testável e extensível.
