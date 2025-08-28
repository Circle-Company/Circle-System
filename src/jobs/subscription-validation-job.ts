import cron from 'node-cron'
import SubscriptionManager from '../services/subscription/SubscriptionManager'
import UserSubscription from '../models/subscription/user-subscription-model'
import { Op } from 'sequelize'

/**
 * Job para validação automática de assinaturas
 */
export class SubscriptionValidationJob {
    private subscriptionManager: SubscriptionManager
    private isRunning: boolean = false

    constructor() {
        this.subscriptionManager = new SubscriptionManager()
    }

    /**
     * Inicia os jobs de validação
     */
    start(): void {
        console.log('Iniciando jobs de validação de assinaturas...')

        // Job para revalidar assinaturas expirando (executa a cada 6 horas)
        cron.schedule('0 */6 * * *', async () => {
            if (this.isRunning) {
                console.log('Job de validação já está rodando, pulando execução')
                return
            }

            console.log('Executando job de revalidação de assinaturas expirando...')
            await this.revalidateExpiringSubscriptions()
        })

        // Job para limpar logs antigos (executa diariamente às 2h)
        cron.schedule('0 2 * * *', async () => {
            console.log('Executando job de limpeza de logs...')
            await this.cleanupOldLogs()
        })

        // Job para verificar assinaturas ativas (executa diariamente às 1h)
        cron.schedule('0 1 * * *', async () => {
            console.log('Executando job de verificação de assinaturas ativas...')
            await this.validateActiveSubscriptions()
        })

        console.log('Jobs de validação de assinaturas iniciados com sucesso')
    }

    /**
     * Revalida assinaturas que estão próximas do vencimento
     */
    private async revalidateExpiringSubscriptions(): Promise<void> {
        try {
            this.isRunning = true

            const twoDaysFromNow = new Date()
            twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

            // Buscar assinaturas que expiram em até 2 dias
            const expiringSubscriptions = await UserSubscription.findAll({
                where: {
                    status: 'active',
                    expires_at: {
                        [Op.between]: [new Date(), twoDaysFromNow]
                    }
                },
                order: [['expires_at', 'ASC']]
            })

            console.log(`Encontradas ${expiringSubscriptions.length} assinaturas expirando`)

            let successCount = 0
            let errorCount = 0

            for (const subscription of expiringSubscriptions) {
                try {
                    const result = await this.subscriptionManager.revalidateSubscription(
                        subscription.id, 
                        'scheduled'
                    )

                    if (result.success) {
                        successCount++
                        console.log(`Assinatura ${subscription.id} revalidada com sucesso`)
                    } else {
                        errorCount++
                        console.warn(`Falha ao revalidar assinatura ${subscription.id}: ${result.error}`)
                    }

                    // Esperar 2 segundos entre validações para não sobrecarregar a API
                    await this.sleep(2000)

                } catch (error) {
                    errorCount++
                    console.error(`Erro ao revalidar assinatura ${subscription.id}:`, error)
                }
            }

            console.log(`Job de revalidação concluído: ${successCount} sucessos, ${errorCount} erros`)

        } catch (error) {
            console.error('Erro no job de revalidação de assinaturas:', error)
        } finally {
            this.isRunning = false
        }
    }

    /**
     * Valida todas as assinaturas ativas para detectar cancelamentos
     */
    private async validateActiveSubscriptions(): Promise<void> {
        try {
            // Buscar assinaturas ativas que não foram validadas nas últimas 24h
            const oneDayAgo = new Date()
            oneDayAgo.setDate(oneDayAgo.getDate() - 1)

            const subscriptionsToValidate = await UserSubscription.findAll({
                where: {
                    status: 'active',
                    [Op.or]: [
                        { last_validated_at: null },
                        { last_validated_at: { [Op.lt]: oneDayAgo } }
                    ]
                },
                limit: 100, // Limitar para não sobrecarregar
                order: [['last_validated_at', 'ASC']]
            })

            console.log(`Validando ${subscriptionsToValidate.length} assinaturas ativas`)

            let successCount = 0
            let errorCount = 0

            for (const subscription of subscriptionsToValidate) {
                try {
                    const result = await this.subscriptionManager.revalidateSubscription(
                        subscription.id,
                        'scheduled'
                    )

                    if (result.success) {
                        successCount++
                    } else {
                        errorCount++
                    }

                    // Esperar 3 segundos entre validações
                    await this.sleep(3000)

                } catch (error) {
                    errorCount++
                    console.error(`Erro ao validar assinatura ${subscription.id}:`, error)
                }
            }

            console.log(`Validação de assinaturas ativas concluída: ${successCount} sucessos, ${errorCount} erros`)

        } catch (error) {
            console.error('Erro no job de validação de assinaturas ativas:', error)
        }
    }

    /**
     * Remove logs de validação antigos (>30 dias)
     */
    private async cleanupOldLogs(): Promise<void> {
        try {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                         const { default: SubscriptionValidationLog } = await import('../models/subscription/subscription-validation-log-model')
            
            const deletedCount = await SubscriptionValidationLog.destroy({
                where: {
                    created_at: {
                        [Op.lt]: thirtyDaysAgo
                    }
                }
            })

            console.log(`Removidos ${deletedCount} logs de validação antigos`)

        } catch (error) {
            console.error('Erro ao limpar logs antigos:', error)
        }
    }

    /**
     * Estatísticas do sistema
     */
    async getStats(): Promise<{
        activeSubscriptions: number
        expiringIn24h: number
        expiringIn7days: number
        failedValidations24h: number
        totalValidations24h: number
    }> {
        try {
            const now = new Date()
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

            const [
                activeSubscriptions,
                expiringIn24h,
                expiringIn7days,
                totalValidations24h,
                failedValidations24h
            ] = await Promise.all([
                UserSubscription.count({
                    where: { status: 'active' }
                }),
                UserSubscription.count({
                    where: {
                        status: 'active',
                        expires_at: {
                            [Op.between]: [now, tomorrow]
                        }
                    }
                }),
                UserSubscription.count({
                    where: {
                        status: 'active',
                        expires_at: {
                            [Op.between]: [now, nextWeek]
                        }
                    }
                }),
                (async () => {
                    const { default: SubscriptionValidationLog } = await import('../models/subscription/subscription-validation-log-model')
                    return SubscriptionValidationLog.count({
                        where: {
                            created_at: {
                                [Op.gte]: yesterday
                            }
                        }
                    })
                })(),
                (async () => {
                    const { default: SubscriptionValidationLog } = await import('../models/subscription/subscription-validation-log-model')
                    return SubscriptionValidationLog.count({
                        where: {
                            created_at: {
                                [Op.gte]: yesterday
                            },
                            validation_result: 'failure'
                        }
                    })
                })()
            ])

            return {
                activeSubscriptions,
                expiringIn24h,
                expiringIn7days,
                totalValidations24h,
                failedValidations24h
            }

        } catch (error) {
            console.error('Erro ao obter estatísticas:', error)
            return {
                activeSubscriptions: 0,
                expiringIn24h: 0,
                expiringIn7days: 0,
                totalValidations24h: 0,
                failedValidations24h: 0
            }
        }
    }

    /**
     * Para o job (útil para testes)
     */
    stop(): void {
        console.log('Parando jobs de validação de assinaturas...')
        cron.destroy()
    }

    /**
     * Função helper para esperar
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Execução manual do job (útil para testes)
     */
    async runNow(): Promise<void> {
        console.log('Executando job de validação manualmente...')
        await this.revalidateExpiringSubscriptions()
    }
}

// Instância singleton
let subscriptionValidationJob: SubscriptionValidationJob | null = null

/**
 * Obtém instância do job
 */
export function getSubscriptionValidationJob(): SubscriptionValidationJob {
    if (!subscriptionValidationJob) {
        subscriptionValidationJob = new SubscriptionValidationJob()
    }
    return subscriptionValidationJob
}

export default SubscriptionValidationJob
