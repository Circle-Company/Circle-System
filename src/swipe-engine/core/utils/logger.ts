/**
 * Utilitário de logging para o SwipeEngine
 * Oferece funcionalidades para log em diferentes níveis
 */

/**
 * Níveis de log suportados
 */
export enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}

/**
 * Mapeamento de cores para níveis de log no console
 */
const LOG_COLORS = {
    [LogLevel.DEBUG]: "\x1b[90m", // Cinza
    [LogLevel.INFO]: "\x1b[36m", // Ciano
    [LogLevel.WARN]: "\x1b[33m", // Amarelo
    [LogLevel.ERROR]: "\x1b[31m", // Vermelho
    reset: "\x1b[0m", // Reset
}

/**
 * Configuração do logger
 */
interface LoggerConfig {
    /** Nível mínimo de log para exibir */
    minLevel: LogLevel
    /** Se deve mostrar timestamp nos logs */
    showTimestamp: boolean
    /** Se deve mostrar os nomes dos componentes nos logs */
    showComponent: boolean
    /** Função para enviar logs para sistemas externos */
    externalLogger?: (level: LogLevel, component: string, message: string, data?: any) => void
}

/**
 * Configuração global do logger
 */
let globalConfig: LoggerConfig = {
    minLevel: LogLevel.INFO,
    showTimestamp: true,
    showComponent: true,
}

/**
 * Cache de instâncias do logger
 */
const loggerInstances: Map<string, Logger> = new Map()

/**
 * Configura opções globais do logger
 * @param config Configuração parcial para mesclar com a configuração padrão
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config }
}

/**
 * Verifica se um nível de log deve ser exibido com base na configuração atual
 */
function shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel)
    const configLevelIndex = levels.indexOf(globalConfig.minLevel)
    const currentLevelIndex = levels.indexOf(level)

    return currentLevelIndex >= configLevelIndex
}

/**
 * Formata uma mensagem de log de acordo com a configuração
 */
function formatMessage(level: LogLevel, component: string, message: string): string {
    const parts: string[] = []

    // Adicionar timestamp se configurado
    if (globalConfig.showTimestamp) {
        parts.push(`[${new Date().toISOString()}]`)
    }

    // Adicionar nível de log
    parts.push(`${LOG_COLORS[level]}[${level.toUpperCase()}]${LOG_COLORS.reset}`)

    // Adicionar componente se configurado
    if (globalConfig.showComponent && component) {
        parts.push(`[${component}]`)
    }

    // Adicionar mensagem
    parts.push(message)

    return parts.join(" ")
}

/**
 * Classe Logger para registrar mensagens em diferentes níveis de severidade
 */
export class Logger {
    /**
     * Nome do componente associado com este logger
     */
    private readonly component: string

    /**
     * Cria uma nova instância de Logger
     * @param component Nome do componente ou módulo para o qual o logger está sendo criado
     */
    constructor(component: string) {
        this.component = component
    }

    /**
     * Registra uma mensagem com nível DEBUG
     * @param message Mensagem a ser registrada
     * @param data Dados opcionais para registrar junto com a mensagem
     */
    debug(message: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, data)
    }

    /**
     * Registra uma mensagem com nível INFO
     * @param message Mensagem a ser registrada
     * @param data Dados opcionais para registrar junto com a mensagem
     */
    info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data)
    }

    /**
     * Registra uma mensagem com nível WARN
     * @param message Mensagem a ser registrada
     * @param data Dados opcionais para registrar junto com a mensagem
     */
    warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data)
    }

    /**
     * Registra uma mensagem com nível ERROR
     * @param message Mensagem a ser registrada
     * @param data Dados opcionais para registrar junto com a mensagem
     */
    error(message: string, data?: any): void {
        this.log(LogLevel.ERROR, message, data)
    }

    /**
     * Implementação interna para registrar mensagens
     * @param level Nível de log
     * @param message Mensagem a ser registrada
     * @param data Dados opcionais para incluir no log
     */
    private log(level: LogLevel, message: string, data?: any): void {
        // Verificar se este nível deve ser registrado
        if (!shouldLog(level)) {
            return
        }

        // Formatar a mensagem
        const formattedMessage = formatMessage(level, this.component, message)

        // Log no console
        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedMessage)
                if (data) console.error(data)
                break
            case LogLevel.WARN:
                console.warn(formattedMessage)
                if (data) console.warn(data)
                break
            case LogLevel.INFO:
                console.info(formattedMessage)
                if (data) console.info(data)
                break
            case LogLevel.DEBUG:
            default:
                console.debug(formattedMessage)
                if (data) console.debug(data)
                break
        }

        // Enviar para o logger externo, se configurado
        if (globalConfig.externalLogger) {
            try {
                globalConfig.externalLogger(level, this.component, message, data)
            } catch (error) {
                console.error("Erro ao enviar log para logger externo:", error)
            }
        }
    }
}

/**
 * Obtém uma instância do logger para um componente específico
 * Reutiliza instâncias existentes para o mesmo componente
 * @param component Nome do componente
 * @returns Instância do logger para o componente
 */
export function getLogger(component: string): Logger {
    if (!loggerInstances.has(component)) {
        loggerInstances.set(component, new Logger(component))
    }
    return loggerInstances.get(component)!
}

/**
 * Logger padrão para uso geral
 */
export const logger = getLogger("SwipeEngine")
