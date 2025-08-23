import { Model } from "sequelize"
import { beforeEach, describe, expect, it, vi } from "vitest"
import NotificationModel from "../../models/notification/notification-model"
import NotificationTokenModel from "../../models/notification/notification_token-model"
import PreferenceModel from "../../models/preference/preference-model"
import FollowModel from "../../models/user/follow-model"
import { Module as CreateOnDBModule } from "../modules/create-on-db"
import { Module as ReceiverUsersModule } from "../modules/receiver-users"
import { Module as VerifyReceiverPermissionsModule } from "../modules/verify-receiver-permissions"
import { NotificationProps } from "../types"

// Mock para o Promise.all global
vi.mock("../modules/create-on-db", async (importOriginal) => {
    const mod = (await importOriginal()) as any
    return {
        ...mod,
        Module: vi.fn(mod.Module),
    }
})

// Mock dos modelos necessários
vi.mock("../../models/notification/notification-model", () => ({
    default: {
        create: vi.fn(),
    },
}))

vi.mock("../../models/notification/notification_token-model", () => ({
    default: {
        findOne: vi.fn(),
    },
}))

vi.mock("../../models/user/follow-model", () => ({
    default: {
        findAll: vi.fn(),
    },
}))

vi.mock("../../models/preference/preference-model", () => ({
    default: {
        findOne: vi.fn(),
    },
}))

// Helper para criar mock de Model do Sequelize
const createSequelizeModelMock = (data: any) => ({
    ...Model.prototype,
    ...data,
    toJSON: () => data,
})

describe("Notification Service Unit Tests", () => {
    beforeEach(() => {
        vi.resetAllMocks()

        // Restaura a implementação original no início de cada teste
        vi.mocked(CreateOnDBModule).mockImplementation(async (props) => {
            // Importa o módulo original para chamar a implementação real
            const { Module } = (await vi.importActual(
                "../modules/create-on-db"
            )) as typeof import("../modules/create-on-db")
            return Module(props)
        })
    })

    describe("Create On DB Module", () => {
        it("Deve criar notificação de FOLLOW-USER", async () => {
            const notification: NotificationProps = {
                type: "FOLLOW-USER",
                data: {
                    senderUserId: BigInt(1),
                    receiverUserId: BigInt(2),
                },
            }

            const mockNotification = createSequelizeModelMock({
                id: BigInt(1),
                sender_user_id: BigInt(1),
                receiver_user_id: BigInt(2),
                type: "FOLLOW-USER",
            })

            vi.mocked(NotificationModel.create).mockResolvedValue(mockNotification)

            const result = await CreateOnDBModule({
                notification,
                usersList: [BigInt(2)],
            })

            expect(result).toEqual(mockNotification)
        })

        it("Deve criar notificação LIKE-MOMENT", async () => {
            const notification: NotificationProps = {
                type: "LIKE-MOMENT",
                data: {
                    senderUserId: BigInt(1),
                    receiverUserId: BigInt(2),
                    momentId: BigInt(123),
                },
            }

            const mockNotification = createSequelizeModelMock({
                id: BigInt(2),
                sender_user_id: BigInt(1),
                receiver_user_id: BigInt(2),
                moment_id: BigInt(123),
                type: "LIKE-MOMENT",
            })

            vi.mocked(NotificationModel.create).mockResolvedValue(mockNotification)

            const result = await CreateOnDBModule({
                notification,
                usersList: [],
            })

            expect(result).toEqual(mockNotification)
        })

        it("Deve criar notificação NEW-MEMORY para múltiplos usuários", async () => {
            const usersList = [BigInt(1), BigInt(2)]
            const notification: NotificationProps = {
                type: "NEW-MEMORY",
                data: {
                    senderUserId: BigInt(3),
                    memoryId: BigInt(123),
                },
            }

            // Configurar o mock para criar notificações para cada usuário
            vi.mocked(NotificationModel.create).mockImplementation((data: any) => {
                return Promise.resolve(
                    createSequelizeModelMock({
                        id: BigInt(Math.floor(Math.random() * 1000)),
                        ...data,
                    })
                )
            })

            // Execute o módulo
            await CreateOnDBModule({
                notification,
                usersList,
            })

            // Verificar que chamadas de criação foram feitas corretamente
            expect(NotificationModel.create).toHaveBeenCalledTimes(usersList.length)

            // Verificar que cada userID na lista foi usado como receiver_user_id
            usersList.forEach((userId) => {
                expect(NotificationModel.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sender_user_id: notification.data.senderUserId,
                        receiver_user_id: userId,
                        memory_id: notification.data.memoryId,
                        type: notification.type,
                    })
                )
            })
        })

        it("Não deve permitir auto-notificação", async () => {
            const notification: NotificationProps = {
                type: "FOLLOW-USER",
                data: {
                    senderUserId: BigInt(1),
                    receiverUserId: BigInt(1),
                },
            }

            const result = await CreateOnDBModule({
                notification,
                usersList: [BigInt(1)],
            })

            expect(result).toHaveProperty(
                "message",
                "a user cannot send notification to themselves"
            )
        })

        it("Deve lidar com erro ao criar notificação", async () => {
            const notification: NotificationProps = {
                type: "FOLLOW-USER",
                data: {
                    senderUserId: BigInt(1),
                    receiverUserId: BigInt(2),
                },
            }

            vi.mocked(NotificationModel.create).mockRejectedValue(new Error("Database error"))

            await expect(
                CreateOnDBModule({
                    notification,
                    usersList: [BigInt(2)],
                })
            ).rejects.toThrow()
        })
    })

    describe("Receiver Users Module", () => {
        it("Deve retornar lista de tokens para NEW-MEMORY", async () => {
            const notification: NotificationProps = {
                type: "NEW-MEMORY",
                data: {
                    senderUserId: BigInt(1),
                    memoryId: BigInt(123),
                },
            }

            const mockFollowers = [
                createSequelizeModelMock({ user_id: BigInt(2) }),
                createSequelizeModelMock({ user_id: BigInt(3) }),
            ]

            const mockTokens = [
                { id: BigInt(2), token: "token2" },
                { id: BigInt(3), token: "token3" },
            ]

            vi.mocked(FollowModel.findAll).mockResolvedValue(mockFollowers)

            vi.mocked(NotificationTokenModel.findOne).mockImplementation(async (query: any) => {
                const userId = query?.where?.user_id
                const token = mockTokens.find((t) => t.id === userId)?.token
                return token ? createSequelizeModelMock({ token }) : null
            })

            const result = await ReceiverUsersModule({ notification })

            expect(result).toHaveLength(2)
            expect(result[0]).toHaveProperty("token", "token2")
            expect(result[1]).toHaveProperty("token", "token3")
        })

        it("Deve retornar lista vazia quando não há seguidores", async () => {
            vi.mocked(FollowModel.findAll).mockResolvedValue([])

            const result = await ReceiverUsersModule({
                notification: {
                    type: "NEW-MEMORY",
                    data: {
                        senderUserId: BigInt(1),
                        memoryId: BigInt(123),
                    },
                },
            })

            expect(result).toEqual([])
        })

        it("Deve lidar com tokens nulos", async () => {
            const mockFollowers = [createSequelizeModelMock({ user_id: BigInt(2) })]

            vi.mocked(FollowModel.findAll).mockResolvedValue(mockFollowers)

            vi.mocked(NotificationTokenModel.findOne).mockImplementation(async () => {
                return createSequelizeModelMock({ token: null })
            })

            const result = await ReceiverUsersModule({
                notification: {
                    type: "NEW-MEMORY",
                    data: {
                        senderUserId: BigInt(1),
                        memoryId: BigInt(123),
                    },
                },
            })

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({ id: BigInt(2), token: null })
        })
    })

    describe("Verify Receiver Permissions Module", () => {
        it("Deve filtrar usuários baseado em preferências", async () => {
            const usersList = [
                { id: BigInt(1), token: "token1" },
                { id: BigInt(2), token: "token2" },
            ]

            const notification: NotificationProps = {
                type: "LIKE-MOMENT",
                data: {
                    senderUserId: BigInt(3),
                    receiverUserId: BigInt(1),
                    momentId: BigInt(123),
                },
            }

            vi.mocked(PreferenceModel.findOne).mockImplementation(async (query: any) => {
                const userId = query?.where?.user_id
                return createSequelizeModelMock({
                    disable_like_moment_push_notification: userId === BigInt(1),
                })
            })

            const result = await VerifyReceiverPermissionsModule({
                usersList,
                notification,
            })

            expect(result).toHaveLength(1)
            expect(result[0]).toHaveProperty("token", "token2")
        })

        it("Deve usar configurações padrão se preferências não encontradas", async () => {
            vi.mocked(PreferenceModel.findOne).mockResolvedValue(null)

            const result = await VerifyReceiverPermissionsModule({
                usersList: [{ id: BigInt(1), token: "token1" }],
                notification: {
                    type: "LIKE-MOMENT",
                    data: {
                        senderUserId: BigInt(2),
                        receiverUserId: BigInt(1),
                        momentId: BigInt(123),
                    },
                },
            })

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
        })

        it("Deve filtrar notificações de VIEW-USER", async () => {
            const mockPreference = createSequelizeModelMock({
                disable_view_user_push_notification: true,
            })

            vi.mocked(PreferenceModel.findOne).mockResolvedValue(mockPreference)

            const result = await VerifyReceiverPermissionsModule({
                usersList: [{ id: BigInt(1), token: "token1" }],
                notification: {
                    type: "VIEW-USER",
                    data: {
                        senderUserId: BigInt(2),
                        receiverUserId: BigInt(1),
                    },
                },
            })

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(0)
        })

        it("Deve lidar com erro ao buscar preferências", async () => {
            vi.mocked(PreferenceModel.findOne).mockRejectedValue(new Error("Database error"))

            const result = await VerifyReceiverPermissionsModule({
                usersList: [{ id: BigInt(1), token: "token1" }],
                notification: {
                    type: "LIKE-MOMENT",
                    data: {
                        senderUserId: BigInt(2),
                        receiverUserId: BigInt(1),
                        momentId: BigInt(123),
                    },
                },
            })

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(0)
        })
    })
})
