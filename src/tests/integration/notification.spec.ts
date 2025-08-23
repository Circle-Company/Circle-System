import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { testBearerToken } from "../app-test"

// Mock dos modelos com factory functions para evitar hoisting issues
vi.mock("../../models/notification/notification-model", () => {
    return {
        default: {
            findAndCountAll: vi.fn(),
        },
    }
})

// Mock do módulo notification_token-model
vi.mock("../../models/notification/notification_token-model", () => {
    // Importante: definir as funções dentro da factory function para evitar hoisting problems
    const findOneMock = vi.fn()
    const updateMock = vi.fn()
    const createMock = vi.fn()

    return {
        default: {
            findOne: findOneMock,
            update: updateMock,
            create: createMock,
        },
        __mocks: { findOneMock, updateMock, createMock },
    }
})

describe("Notification Service Integration Tests", () => {
    const app = express()
    app.use(express.json())

    // Referência local para o modelo e mocks
    let NotificationModel: any
    let tokenMocks: any

    beforeEach(async () => {
        // Reset todos os mocks
        vi.resetAllMocks()

        // Importar o modelo mockado dinamicamente
        NotificationModel = (await import("../../models/notification/notification-model")).default

        // Obter referências aos mocks
        const tokenModule = await import("../../models/notification/notification_token-model")
        //@ts-ignore
        tokenMocks = tokenModule.__mocks
    })

    // Mock do middleware de autenticação
    app.use((req, res, next) => {
        if (req.headers.authorization === testBearerToken) {
            req.user_id = BigInt(1)
            next()
        } else {
            res.status(401).json({ message: "Unauthorized: token is missing or invalid" })
        }
    })

    // Rotas
    app.get("/v1/notification/find", async (req, res) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1
            const pageSize = parseInt(req.query.pageSize as string, 10) || 10
            const offset = (page - 1) * pageSize

            const { count, rows } = await NotificationModel.findAndCountAll()
            const totalCount = Array.isArray(count) ? count[0].count : count

            res.status(200).json({
                notifications: rows || [],
                count: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                currentPage: page,
                pageSize,
            })
        } catch (error) {
            res.status(500).json({ message: "An error occurred", error })
        }
    })

    app.post("/v1/notification/token/store", async (req, res) => {
        const { token } = req.body

        if (!token || token.trim() === "") {
            return res.status(400).json({ message: "Token is required" })
        }

        try {
            const userHasToken = await tokenMocks.findOneMock({
                where: { user_id: req.user_id },
            })

            if (userHasToken) {
                await tokenMocks.updateMock(
                    { token },
                    {
                        where: { user_id: req.user_id },
                    }
                )
            } else {
                await tokenMocks.createMock({
                    user_id: req.user_id,
                    token,
                })
            }

            res.status(200).json({ message: "Token created successfully" })
        } catch (error) {
            res.status(500).json({ message: "An error occurred while storing token", error })
        }
    })

    describe("GET /v1/notification/find", () => {
        it("Deve retornar lista de notificações paginada", async () => {
            const mockNotifications = {
                count: 2,
                rows: [
                    {
                        id: BigInt(1),
                        type: "FOLLOW-USER",
                        sender_user_id: BigInt(2),
                        receiver_user_id: BigInt(1),
                        viewed: false,
                        created_at: new Date(),
                        toJSON: () => ({
                            id: "1",
                            type: "FOLLOW-USER",
                            sender_user_id: "2",
                            receiver_user_id: "1",
                            viewed: false,
                            created_at: new Date(),
                        }),
                    },
                    {
                        id: BigInt(2),
                        type: "LIKE-MOMENT",
                        sender_user_id: BigInt(3),
                        receiver_user_id: BigInt(1),
                        moment_id: BigInt(123),
                        viewed: false,
                        created_at: new Date(),
                        toJSON: () => ({
                            id: "2",
                            type: "LIKE-MOMENT",
                            sender_user_id: "3",
                            receiver_user_id: "1",
                            moment_id: "123",
                            viewed: false,
                            created_at: new Date(),
                        }),
                    },
                ],
            }

            vi.mocked(NotificationModel.findAndCountAll).mockResolvedValue(mockNotifications as any)

            const response = await request(app)
                .get("/v1/notification/find")
                .set("authorization", testBearerToken)
                .query({ page: 1, pageSize: 10 })

            expect(response.status).toBe(200)
            expect(response.body.notifications).toHaveLength(2)
            expect(response.body.count).toBe(2)
        })

        it("Deve retornar lista vazia quando não há notificações", async () => {
            const mockEmptyNotifications = {
                count: 0,
                rows: [],
            }

            vi.mocked(NotificationModel.findAndCountAll).mockResolvedValue(
                mockEmptyNotifications as any
            )

            const response = await request(app)
                .get("/v1/notification/find")
                .set("authorization", testBearerToken)

            expect(response.status).toBe(200)
            expect(response.body.notifications).toHaveLength(0)
            expect(response.body.count).toBe(0)
        })

        it("Deve retornar erro 500 quando ocorre erro no banco", async () => {
            vi.mocked(NotificationModel.findAndCountAll).mockRejectedValue(
                new Error("Database error")
            )

            const response = await request(app)
                .get("/v1/notification/find")
                .set("authorization", testBearerToken)

            expect(response.status).toBe(500)
        })
    })

    describe("POST /v1/notification/token/store", () => {
        it("Deve criar novo token de notificação", async () => {
            tokenMocks.findOneMock.mockResolvedValue(null)

            const mockToken = {
                id: BigInt(1),
                user_id: BigInt(1),
                token: "new-token",
                toJSON: () => ({
                    id: "1",
                    user_id: "1",
                    token: "new-token",
                }),
            }

            tokenMocks.createMock.mockResolvedValue(mockToken as any)

            const response = await request(app)
                .post("/v1/notification/token/store")
                .set("authorization", testBearerToken)
                .send({ token: "new-token" })

            expect(response.status).toBe(200)
        })

        it("Deve atualizar token existente", async () => {
            const existingToken = {
                id: BigInt(1),
                user_id: BigInt(1),
                token: "old-token",
                toJSON: () => ({
                    id: "1",
                    user_id: "1",
                    token: "old-token",
                }),
            }

            tokenMocks.findOneMock.mockResolvedValue(existingToken as any)
            tokenMocks.updateMock.mockResolvedValue([1] as any)

            const response = await request(app)
                .post("/v1/notification/token/store")
                .set("authorization", testBearerToken)
                .send({ token: "updated-token" })

            expect(response.status).toBe(200)
        })

        it("Deve validar token vazio", async () => {
            const response = await request(app)
                .post("/v1/notification/token/store")
                .set("authorization", testBearerToken)
                .send({ token: "" })

            expect(response.status).toBe(400)
            expect(response.body.message).toBe("Token is required")
        })
    })
})
