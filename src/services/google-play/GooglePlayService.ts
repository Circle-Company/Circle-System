import { JWT } from 'google-auth-library'
import { google } from 'googleapis'

export interface GooglePlayReceipt {
    purchaseToken: string
    productId: string
    orderId: string
    packageName: string
}

export interface SubscriptionPurchase {
    kind: string
    startTimeMillis: string
    expiryTimeMillis: string
    autoRenewing: boolean
    priceCurrencyCode: string
    priceAmountMicros: string
    countryCode: string
    developerPayload?: string
    paymentState: number
    cancelReason?: number
    userCancellationTimeMillis?: string
    orderState: number
    linkedPurchaseToken?: string
    purchaseType?: number
    priceChange?: any
    profileName?: string
    emailAddress?: string
    givenName?: string
    familyName?: string
    profileId?: string
    acknowledgementState: number
    externalAccountId?: string
    promotionType?: number
    promotionCode?: string
    obfuscatedExternalAccountId?: string
    obfuscatedExternalProfileId?: string
}

export interface ValidationResult {
    isValid: boolean
    subscription?: SubscriptionPurchase
    error?: string
    expiresAt?: Date
    isActive?: boolean
    autoRenewing?: boolean
    orderId?: string
}

/**
 * Serviço para integração com Google Play Store
 * Valida receitas de compras in-app e assinaturas
 */
export class GooglePlayService {
    private static instance: GooglePlayService
    private auth: JWT | null = null
    private androidPublisher: any = null

    private constructor() {}

    static getInstance(): GooglePlayService {
        if (!GooglePlayService.instance) {
            GooglePlayService.instance = new GooglePlayService()
        }
        return GooglePlayService.instance
    }

    /**
     * Inicializa a autenticação com Google Play
     */
    async initialize(): Promise<void> {
        try {
            const serviceAccountKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY
            
            if (!serviceAccountKey) {
                throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY não configurada')
            }

            // Parse da chave de serviço
            const keyData = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString())

            // Configurar autenticação JWT
            this.auth = new JWT({
                email: keyData.client_email,
                key: keyData.private_key,
                scopes: ['https://www.googleapis.com/auth/androidpublisher']
            })

            // Inicializar cliente da API
            this.androidPublisher = google.androidpublisher({
                version: 'v3',
                auth: this.auth
            })

            console.log('Google Play Service inicializado com sucesso')
        } catch (error) {
            console.error('Erro ao inicializar Google Play Service:', error)
            throw error
        }
    }

    /**
     * Valida uma assinatura do Google Play Store
     */
    async validateSubscription(receipt: GooglePlayReceipt): Promise<ValidationResult> {
        try {
            if (!this.androidPublisher) {
                await this.initialize()
            }

            const packageName = receipt.packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME

            if (!packageName) {
                return {
                    isValid: false,
                    error: 'Package name não configurado'
                }
            }

            // Buscar detalhes da assinatura
            const response = await this.androidPublisher.purchases.subscriptions.get({
                packageName: packageName,
                subscriptionId: receipt.productId,
                token: receipt.purchaseToken
            })

            const subscription: SubscriptionPurchase = response.data

            // Verificar se a assinatura é válida
            const now = Date.now()
            const expiryTime = parseInt(subscription.expiryTimeMillis)
            const isActive = expiryTime > now
            const isAcknowledged = subscription.acknowledgementState === 1

            return {
                isValid: isActive && isAcknowledged,
                subscription: subscription,
                expiresAt: new Date(expiryTime),
                isActive: isActive,
                autoRenewing: subscription.autoRenewing,
                orderId: receipt.orderId
            }

        } catch (error: any) {
            console.error('Erro ao validar assinatura:', error)
            
            // Verificar se é erro de token inválido
            if (error.code === 400 || error.code === 410) {
                return {
                    isValid: false,
                    error: 'Token de compra inválido ou expirado'
                }
            }

            return {
                isValid: false,
                error: `Erro na validação: ${error.message}`
            }
        }
    }

    /**
     * Confirma/Reconhece uma assinatura
     */
    async acknowledgeSubscription(receipt: GooglePlayReceipt, developerPayload?: string): Promise<boolean> {
        try {
            if (!this.androidPublisher) {
                await this.initialize()
            }

            const packageName = receipt.packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME

            await this.androidPublisher.purchases.subscriptions.acknowledge({
                packageName: packageName,
                subscriptionId: receipt.productId,
                token: receipt.purchaseToken,
                requestBody: {
                    developerPayload: developerPayload
                }
            })

            console.log(`Assinatura reconhecida: ${receipt.orderId}`)
            return true

        } catch (error: any) {
            console.error('Erro ao reconhecer assinatura:', error)
            return false
        }
    }

    /**
     * Cancela uma assinatura
     */
    async cancelSubscription(receipt: GooglePlayReceipt): Promise<boolean> {
        try {
            if (!this.androidPublisher) {
                await this.initialize()
            }

            const packageName = receipt.packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME

            await this.androidPublisher.purchases.subscriptions.cancel({
                packageName: packageName,
                subscriptionId: receipt.productId,
                token: receipt.purchaseToken
            })

            console.log(`Assinatura cancelada: ${receipt.orderId}`)
            return true

        } catch (error: any) {
            console.error('Erro ao cancelar assinatura:', error)
            return false
        }
    }

    /**
     * Obtém todas as assinaturas de um usuário
     */
    async getUserSubscriptions(packageName: string): Promise<SubscriptionPurchase[]> {
        try {
            if (!this.androidPublisher) {
                await this.initialize()
            }

            // Google Play não oferece API para listar todas as assinaturas de um usuário
            // Seria necessário manter registro próprio no banco de dados
            throw new Error('Use banco de dados próprio para listar assinaturas do usuário')

        } catch (error: any) {
            console.error('Erro ao buscar assinaturas do usuário:', error)
            return []
        }
    }

    /**
     * Verifica se um produto existe no Google Play Console
     */
    async validateProduct(productId: string, packageName?: string): Promise<boolean> {
        try {
            if (!this.androidPublisher) {
                await this.initialize()
            }

            const pkg = packageName || process.env.GOOGLE_PLAY_PACKAGE_NAME

            const response = await this.androidPublisher.inappproducts.get({
                packageName: pkg,
                sku: productId
            })

            return response.data && response.data.status === 'active'

        } catch (error: any) {
            console.error('Erro ao validar produto:', error)
            return false
        }
    }

    /**
     * Converte paymentState para string legível
     */
    static parsePaymentState(paymentState: number): string {
        switch (paymentState) {
            case 0: return 'payment_pending'
            case 1: return 'payment_received'
            case 2: return 'free_trial'
            case 3: return 'pending_deferred'
            default: return 'unknown'
        }
    }

    /**
     * Converte cancelReason para string legível
     */
    static parseCancelReason(cancelReason?: number): string {
        if (!cancelReason) return 'none'
        
        switch (cancelReason) {
            case 0: return 'user_canceled'
            case 1: return 'system_canceled'
            case 2: return 'replaced'
            case 3: return 'developer_canceled'
            default: return 'unknown'
        }
    }

    /**
     * Converte acknowledgementState para string legível
     */
    static parseAcknowledgementState(acknowledgementState: number): string {
        switch (acknowledgementState) {
            case 0: return 'yet_to_be_acknowledged'
            case 1: return 'acknowledged'
            default: return 'unknown'
        }
    }
}

export default GooglePlayService
