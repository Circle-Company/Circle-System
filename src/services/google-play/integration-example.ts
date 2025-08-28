/**
 * Exemplo de como integrar o sistema de assinaturas Google Play
 * no seu app Express.js principal
 */

import express from 'express'
import subscriptionRoutes from '../../routes/subscription-router'
import GooglePlayService from './GooglePlayService'
import { getSubscriptionValidationJob } from '../../jobs/subscription-validation-job'
import { validateGooglePlayConfig } from '../../config/google-play'

// ==================== CONFIGURAÇÃO INICIAL ====================

export async function initializeGooglePlayIntegration(app: express.Application): Promise<void> {
    try {
        console.log('Inicializando integração Google Play...')

        // 1. Validar configurações
        validateGooglePlayConfig()
        console.log('✓ Configurações Google Play validadas')

        // 2. Inicializar Google Play Service
        const googlePlayService = GooglePlayService.getInstance()
        await googlePlayService.initialize()
        console.log('✓ Google Play Service inicializado')

        // 3. Configurar rotas de assinatura
        app.use('/api/subscription', subscriptionRoutes)
        console.log('✓ Rotas de assinatura configuradas')

        // 4. Iniciar jobs de validação automática
        const validationJob = getSubscriptionValidationJob()
        validationJob.start()
        console.log('✓ Jobs de validação iniciados')

        // 5. Adicionar endpoint de health check
        app.get('/api/subscription/health', async (req, res) => {
            try {
                const stats = await validationJob.getStats()
                res.json({
                    success: true,
                    status: 'healthy',
                    timestamp: new Date(),
                    stats: stats
                })
            } catch (error) {
                res.status(500).json({
                    success: false,
                    status: 'unhealthy',
                    error: 'Erro ao obter estatísticas'
                })
            }
        })

        console.log('🎉 Integração Google Play inicializada com sucesso!')

    } catch (error) {
        console.error('❌ Erro ao inicializar integração Google Play:', error)
        throw error
    }
}

// ==================== EXEMPLO DE USO EM CONTROLLERS ====================

/**
 * Exemplo de como usar o sistema em um controller de momento
 */
export class ExampleMomentController {
    /**
     * Criar momento com validação premium
     */
    async createMoment(req: express.Request, res: express.Response): Promise<void> {
        try {
            const userId = req.user?.id
            const { content, isPrivate } = req.body

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Usuário não autenticado'
                })
                return
            }

            // Importar UserFactory dinamicamente para evitar circular dependency
            const { UserFactory } = await import('../../classes/user/UserFactory')
            const user = await UserFactory.createUser(BigInt(userId))

            // Verificar se usuário pode criar momentos
            const canPost = await user.canAccessFeature('basic_posting')
            if (!canPost) {
                res.status(402).json({
                    success: false,
                    error: 'Limite de posts atingido',
                    action: 'Assine o Circle Premium para limites maiores'
                })
                return
            }

            // Verificar se pode criar momento privado (premium)
            if (isPrivate) {
                const canCreatePrivate = await user.canAccessFeature('private_moments')
                if (!canCreatePrivate) {
                    res.status(402).json({
                        success: false,
                        error: 'Momentos privados são exclusivos para usuários premium',
                        action: 'Assine o Circle Premium para criar momentos privados'
                    })
                    return
                }
            }

            // Rastrear uso da feature
            await user.trackFeatureUsage('posts')

            // TODO: Implementar lógica de criação do momento
            const moment = {
                id: Date.now(),
                content: content,
                isPrivate: isPrivate,
                userId: userId,
                createdAt: new Date()
            }

            res.status(201).json({
                success: true,
                data: moment,
                userType: user.getUserType(),
                remainingPosts: await user.getRemainingFeatureUsage('posts')
            })

        } catch (error) {
            console.error('Erro ao criar momento:', error)
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            })
        }
    }

    /**
     * Impulsionar momento (premium)
     */
    async boostMoment(req: express.Request, res: express.Response): Promise<void> {
        try {
            const userId = req.user?.id
            const { momentId, boostType = 'standard' } = req.body

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Usuário não autenticado'
                })
                return
            }

            const { UserFactory } = await import('../../classes/user/UserFactory')
            const user = await UserFactory.createUser(BigInt(userId))

            // Verificar se pode usar boost
            const canBoost = await user.canAccessFeature('moment_boost')
            if (!canBoost) {
                res.status(402).json({
                    success: false,
                    error: 'Boost de momentos é exclusivo para usuários premium',
                    action: 'Assine o Circle Premium para impulsionar seus momentos'
                })
                return
            }

            // Verificar limite mensal de boosts
            const remainingBoosts = await user.getRemainingFeatureUsage('boosts')
            if (remainingBoosts <= 0) {
                res.status(402).json({
                    success: false,
                    error: 'Limite mensal de boosts esgotado',
                    action: 'Aguarde o próximo mês para mais boosts'
                })
                return
            }

            // Rastrear uso
            await user.trackFeatureUsage('boosts')

            // TODO: Implementar lógica de boost
            const boost = {
                momentId: momentId,
                boostType: boostType,
                duration: 24, // horas
                startedAt: new Date()
            }

            res.json({
                success: true,
                data: boost,
                remainingBoosts: remainingBoosts - 1
            })

        } catch (error) {
            console.error('Erro ao impulsionar momento:', error)
            res.status(500).json({
                success: false,
                error: 'Erro interno do servidor'
            })
        }
    }
}

// ==================== EXEMPLO DE MIDDLEWARE PERSONALIZADO ====================

/**
 * Middleware para logs detalhados de requests premium
 */
export function premiumRequestLogger(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const startTime = Date.now()

    // Log da requisição
    console.log(`[PREMIUM] ${req.method} ${req.path} - User: ${req.user?.id} - IP: ${req.ip}`)

    // Interceptar resposta para log completo
    const originalSend = res.send
    res.send = function(body) {
        const responseTime = Date.now() - startTime
        const statusCode = res.statusCode

        console.log(`[PREMIUM] ${req.method} ${req.path} - ${statusCode} - ${responseTime}ms`)

        // Se é erro de pagamento, log adicional
        if (statusCode === 402) {
            console.log(`[PREMIUM_DENIED] User ${req.user?.id} tentou acessar ${req.path} sem permissão`)
        }

        return originalSend.call(this, body)
    }

    next()
}

// ==================== EXEMPLO DE CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE ====================

/**
 * Exemplo de .env necessário para o sistema funcionar
 */
export const requiredEnvironmentVariables = `
# Google Play Store Configuration
GOOGLE_PLAY_PACKAGE_NAME=com.circle.app
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=<base64_encoded_service_account_json>
GOOGLE_PLAY_PUBLIC_KEY=<optional_public_key_for_webhook_verification>

# Database Configuration (já existente)
DATABASE_URL=postgresql://user:password@localhost:5432/circle_db

# Application Configuration
NODE_ENV=production
PORT=3000

# Exemplo de Service Account Key (não usar em produção)
# Gere uma nova chave no Google Cloud Console -> APIs & Services -> Credentials
# Baixe o JSON e converta para base64: base64 -i service-account-key.json
`

export default {
    initializeGooglePlayIntegration,
    ExampleMomentController,
    premiumRequestLogger,
    requiredEnvironmentVariables
}
