// ==================== TIPOS EXISTENTES ====================
export type FindUserByUsernameProps = {
    user_id: bigint
    username: string
}

export type FindUserDataProps = {
    user_id: bigint
    username: string
}

export type UserSearchProps = {
    userId: bigint
    searchTerm: string
}

export type RecommenderUsersProps = {
    user_id: bigint
}

export type FollowUserProps = {
    user_id: bigint
    followed_user_id: bigint
}

export type BlockUserProps = {
    user_id: bigint
    blocked_user_id: bigint
}

export type ReportUserProps = {
    user_id: bigint
    reported_content_id: bigint
    reported_content_type: ReportContentType
    report_type: ReportTypes
}

type ReportContentType = "USER" | "MOMENT" | "MEMORY" | "COMMENT"

type ReportTypes =
    | "FAKE-NEWS"
    | "SPAM"
    | "BULLYING-OR-HARASSMENT"
    | "NUDITY-OR-SEXUAL-ACTIVITY"
    | "HATE-SPEACH-OR-SYMBOILS"
    | "SCAM-OR-FRAUD"
    | "SALE-REGULATED-OR-ILLICIT-PRODUCTS"
    | "SUICIDE-OR-SELF-MUTILATION"
    | "EATING-DISORDERS"

// ==================== NOVOS TIPOS PARA CLASSES USER ====================

/**
 * Tipos de assinatura disponíveis
 */
export type SubscriptionTier = 'free' | 'premium'

/**
 * Status da assinatura
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'paused' | 'pending'

/**
 * Tipos de boost disponíveis
 */
export type BoostType = 'engagement' | 'temporal' | 'visibility'

/**
 * Dados básicos do usuário
 */
export interface UserData {
    id: bigint
    username: string
    name?: string | null
    email?: string | null
    subscription_tier: SubscriptionTier
    verifyed?: boolean
    blocked?: boolean
    deleted?: boolean
    muted?: boolean
    access_level?: number
    description?: string | null
    send_notification_emails?: boolean
    created_at?: Date
    updated_at?: Date
    
    // Dados relacionados (opcional)
    statistics?: any
    preferences?: any
}

/**
 * Dados da assinatura do usuário (Google Play)
 */
export interface UserSubscription {
    id: bigint
    user_id: bigint
    purchase_token: string
    product_id: string
    order_id: string
    status: SubscriptionStatus
    purchased_at: Date
    expires_at: Date
    starts_at: Date
    canceled_at?: Date | null
    acknowledgment_state: 'acknowledged' | 'pending'
    auto_renewing: boolean
    price_amount_micros: number
    price_currency_code: string
    country_code: string
    original_json: string
    developer_payload?: string | null
    last_validated_at?: Date | null
    validation_attempts: number
    created_at: Date
    updated_at: Date
}

/**
 * Limites de rate limiting
 */
export interface RateLimit {
    requests: number        // Número de requests permitidos
    window: string          // Janela de tempo (ex: '1h', '15m')
    burst?: number          // Limite de burst (picos)
}

/**
 * Limites de armazenamento
 */
export interface StorageLimit {
    totalMB: number                    // Espaço total em MB
    videoDurationMax: number           // Duração máxima de vídeo em segundos
    imagesMax: number                  // Número máximo de imagens
    memoriesMax: number                // Número máximo de memórias (-1 = ilimitado)
    momentsPerDay: number              // Posts por dia
    videoResolution: 'SD' | 'HD' | '4K'  // Resolução máxima
    imageQuality: 'low' | 'medium' | 'high' // Qualidade de imagem
}

/**
 * Limites mensais de uso
 */
export interface MonthlyLimits {
    posts: number           // Posts por mês
    likes: number           // Likes por mês
    comments: number        // Comentários por mês
    follows: number         // Follows por mês
    searches: number        // Buscas por mês
    profile_views: number   // Views de perfil por mês
    boosts?: number         // Boosts por mês (apenas premium)
}

/**
 * Uso de uma feature específica
 */
export interface FeatureUsage {
    count: number                                    // Contador atual
    lastUsedAt: Date | null                         // Última vez que foi usada
    resetPeriod: 'daily' | 'monthly' | 'yearly'     // Período de reset
    lastResetAt: Date                               // Última vez que foi resetada
}

/**
 * Estatísticas detalhadas de uso de feature
 */
export interface FeatureUsageStats {
    current: number                                 // Uso atual
    limit: number                                   // Limite (-1 = ilimitado)
    resetPeriod: 'daily' | 'monthly' | 'yearly'    // Período de reset
    lastUsedAt: Date | null                        // Última vez usada
    resetDate: Date                                // Próxima data de reset
    percentage: number                             // Percentual usado (0-100)
}

/**
 * Resultado de verificação do Google Play
 */
export interface GooglePlaySubscriptionResult {
    valid: boolean
    autoRenewing?: boolean
    expiryTimeMillis?: number
    startTimeMillis?: number
    orderId?: string
    purchaseType?: number
    acknowledgmentState?: number
    kind?: string
    regionCode?: string
    priceAmountMicros?: number
    priceCurrencyCode?: string
    countryCode?: string
    developerPayload?: string
    cancelReason?: number
    userCancellationTimeMillis?: number
}

/**
 * Resultado de criação de assinatura
 */
export interface SubscriptionResult {
    subscriptionId: string
    status: string
    clientSecret?: string
    trial_end?: Date | null
}

/**
 * Resultado de pagamento PIX (se necessário no futuro)
 */
export interface PixPaymentResult {
    paymentId: string
    pixCode: string
    qrCodeImage: string
    expiresAt: Date
    amount: number
}

/**
 * Evento de tentativa de acesso a feature
 */
export interface FeatureAttemptEvent {
    userId: bigint
    feature: string
    subscriptionTier: SubscriptionTier
    timestamp: Date
}

/**
 * Evento de assinatura
 */
export interface SubscriptionEvent {
    user_id: bigint
    event_type: 'created' | 'renewed' | 'canceled' | 'expired' | 'upgraded' | 'downgraded'
    subscription_tier: SubscriptionTier
    metadata?: Record<string, any>
    timestamp: Date
}

/**
 * Opções de contexto para recomendações
 */
export interface RecommendationContext {
    timeOfDay?: number
    dayOfWeek?: number
    weekday?: boolean
    weekend?: boolean
    morning?: boolean
    afternoon?: boolean
    evening?: boolean
    night?: boolean
    location?: string
    timestamp?: string
}

/**
 * Configuração de features por tier
 */
export interface TierConfig {
    features: string[]
    limits: MonthlyLimits
    storage: StorageLimit
    rate_limits: Record<string, RateLimit>
}

/**
 * Configuração de produtos do Google Play
 */
export interface GooglePlayProduct {
    id: string
    name: string
    price_brl: number
    billing_period: 'monthly' | 'yearly'
    trial_days?: number
    popular?: boolean
    recommended_for?: string
    savings_percentage?: number
}

/**
 * Erro de pagamento
 */
export class PaymentError extends Error {
    constructor(options: { message: string }) {
        super(options.message)
        this.name = 'PaymentError'
    }
}

/**
 * Erro de validação
 */
export class ValidationError extends Error {
    constructor(options: { message: string }) {
        super(options.message)
        this.name = 'ValidationError'
    }
}

/**
 * Erro de webhook
 */
export class WebhookError extends Error {
    constructor(options: { message: string }) {
        super(options.message)
        this.name = 'WebhookError'
    }
}

/**
 * Erro de pagamento obrigatório (402)
 */
export class PaymentRequiredError extends Error {
    public action?: string
    public renewal_url?: string

    constructor(options: { message: string, action?: string, renewal_url?: string }) {
        super(options.message)
        this.name = 'PaymentRequiredError'
        this.action = options.action
        this.renewal_url = options.renewal_url
    }
}