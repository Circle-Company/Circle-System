/**
 * Configuração para integração com Google Play Store
 */

export interface GooglePlayConfig {
    packageName: string
    serviceAccountKey: string
    publicKey?: string
    products: {
        [key: string]: {
            id: string
            name: string
            type: 'subscription' | 'product'
            price: number
            discount_price?: number
            currency: string
            features: string[]
        }
    }
}

export const googlePlayConfig: GooglePlayConfig = {
    // Nome do pacote do app no Google Play
    packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.circlecompany.circleapp',
    
    // Chave de conta de serviço (base64 encoded JSON)
    serviceAccountKey: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || '',
    
    // Chave pública para verificar webhooks (opcional)
    publicKey: process.env.GOOGLE_PLAY_PUBLIC_KEY,
    
    // Produtos disponíveis
    products: {
        'circle_premium_weekly': {
            id: 'circle_premium_weekly',
            name: 'Circle Premium Weekly',
            type: 'subscription',
            price: 11.99,
            discount_price: 7.99,
            currency: 'BRL',
            features: [
                'moment_feed_boost',
                'advanced_profile_analytics',
                'search_ranker_boost',
                'boost_on_recommendation',
                'infinite_profile_visits_view',
                'priority_notifications',
                'priority_feed_placement',
                'description_size_increase',
                'ad_free'
            ]
        },
        'circle_premium_monthly': {
            id: 'circle_premium_monthly',
            name: 'Circle Premium Monthly',
            type: 'subscription',
            price: 19.99,
            discount_price: 12.99,
            currency: 'BRL',
            features: [
                'moment_feed_boost',
                'advanced_profile_analytics',
                'search_ranker_boost',
                'boost_on_recommendation',
                'infinite_profile_visits_view',
                'priority_notifications',
                'priority_feed_placement',
                'description_size_increase',
                'ad_free'
            ]
        },
        'circle_premium_yearly': {
            id: 'circle_premium_yearly',
            name: 'Circle Premium Yearly',
            type: 'subscription',
            price: 99.99,
            discount_price: 69.99,
            currency: 'BRL',
            features: [
                'moment_feed_boost',
                'advanced_profile_analytics',
                'search_ranker_boost',
                'boost_on_recommendation',
                'infinite_profile_visits_view',
                'priority_notifications',
                'priority_feed_placement',
                'description_size_increase',
                'ad_free'
            ]
        }
    }
}

/**
 * Valida se as configurações estão corretas
 */
export function validateGooglePlayConfig(): void {
    const errors: string[] = []

    if (!googlePlayConfig.packageName) {
        errors.push('GOOGLE_PLAY_PACKAGE_NAME não configurado')
    }

    if (!googlePlayConfig.serviceAccountKey) {
        errors.push('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY não configurado')
    }

    // Validar se a chave de serviço é um JSON válido em base64
    if (googlePlayConfig.serviceAccountKey) {
        try {
            const decoded = Buffer.from(googlePlayConfig.serviceAccountKey, 'base64').toString()
            const keyData = JSON.parse(decoded)
            
            if (!keyData.client_email || !keyData.private_key) {
                errors.push('Service Account Key inválida - faltam client_email ou private_key')
            }
        } catch (error) {
            errors.push('Service Account Key inválida - não é um JSON base64 válido')
        }
    }

    if (errors.length > 0) {
        throw new Error(`Configuração Google Play inválida: ${errors.join(', ')}`)
    }
}

/**
 * Obtém configuração de um produto específico
 */
export function getProductConfig(productId: string) {
    const product = googlePlayConfig.products[productId]
    
    if (!product) {
        throw new Error(`Produto não encontrado: ${productId}`)
    }
    
    return product
}

/**
 * Lista todos os produtos disponíveis
 */
export function getAllProducts() {
    return Object.values(googlePlayConfig.products)
}

/**
 * Verifica se um produto é uma assinatura
 */
export function isSubscriptionProduct(productId: string): boolean {
    const product = googlePlayConfig.products[productId]
    return product?.type === 'subscription'
}

export default googlePlayConfig
