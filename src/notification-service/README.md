# Módulo de Notificações

Este módulo é responsável pelo gerenciamento e envio automático de notificações push utilizando Firebase Cloud Messaging (FCM).

## Arquitetura

O módulo é composto por três componentes principais:

1. **TriggerManager**: Classe principal que gerencia o envio de notificações
2. **TriggerRule**: Interface para definição de regras de notificação
3. **TriggerScheduler**: Serviço que executa as regras automaticamente

### Estrutura de Diretórios

```
src/notification-service/modules/circleTrigger/
├── rules/                   # Regras de notificação específicas
├── scheduler/               # Agendador de notificações
├── templates/               # Templates de mensagens
├── manager.ts               # Gerenciador principal
└── types.ts                 # Tipos e interfaces
```

## Tipagens

```typescript
export interface NotificationMessage {
    title: string
    body: string
    data?: Record<string, string>
    imageUrl?: string
}

export type ScheduleFrequency = "once" | "daily" | "weekly" | "monthly"
export type DayOfWeek =
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"

export interface Schedule {
    frequency: ScheduleFrequency
    dayOfWeek?: DayOfWeek
    time: string // formato HH:mm
    timezone?: string
}

export interface NotificationRule {
    id: string
    name: string
    description: string
    condition: () => Promise<boolean>
    getTargetUsers: () => Promise<string[]>
    getMessage: (userData?: Record<string, any>) => NotificationMessage
    getSchedule: () => Schedule
}

export interface NotificationResult {
    success: boolean
    messageId?: string
    error?: Error
    userId: string
    ruleId: string
    timestamp: Date
}

export interface NotificationStats {
    delivered: number
    failed: number
    opened: number
    totalSent: number
}

export interface UserNotificationPreferences {
    enabled: boolean
    quietHoursStart?: string // HH:mm
    quietHoursEnd?: string // HH:mm
    timezone: string
    disabledCategories?: string[]
}
```

## Implementação de Regras

As regras são classes que implementam a interface `NotificationRule`:

```typescript
interface NotificationRule {
    id: string
    name: string
    description: string
    condition: () => Promise<boolean>
    getTargetUsers: () => Promise<string[]>
    getMessage: () => NotificationMessage
    getSchedule: () => Schedule
}
```

### Exemplo de Regra

```typescript
class InactiveUserRule implements NotificationRule {
    id = "inactive-users"
    name = "Usuários Inativos"
    description = "Notifica usuários que não acessam o app há 7 dias"

    async condition() {
        return true // Lógica de verificação
    }

    async getTargetUsers() {
        // Retorna lista de tokens dos usuários inativos
    }

    getMessage() {
        return {
            title: "Sentimos sua falta!",
            body: "Volte para ver as novidades",
        }
    }

    getSchedule() {
        return {
            frequency: "weekly",
            dayOfWeek: "monday",
            time: "10:00",
        }
    }
}
```

## Uso

1. Crie uma nova regra implementando a interface `NotificationRule`
2. Registre a regra no `NotificationManager`:

```typescript
const manager = new NotificationManager()
manager.registerRule(new InactiveUserRule())
```

3. O `NotificationScheduler` executará automaticamente as regras conforme suas configurações de agendamento.

## Configuração do Scheduler

O scheduler utiliza node-cron para executar as regras periodicamente. Cada regra define sua própria frequência de execução através do método `getSchedule()`.

## Tipos de Regras Suportadas

-   Usuários inativos
-   Eventos próximos
-   Atualizações do sistema
-   Lembretes personalizados
-   Campanhas sazonais

## Personalização de Mensagens

As mensagens podem ser personalizadas usando templates Handlebars:

```typescript
const template = {
    title: "Olá {{userName}}!",
    body: "Temos {{count}} novidades para você",
}
```

## Monitoramento

O módulo inclui logs detalhados e métricas de:

-   Taxa de entrega
-   Taxa de abertura
-   Engajamento por tipo de notificação
-   Erros de envio

## Boas Práticas

1. Evite enviar muitas notificações ao mesmo usuário
2. Respeite preferências de horário do usuário
3. Personalize mensagens quando possível
4. Implemente rate limiting
5. Monitore métricas de engajamento
