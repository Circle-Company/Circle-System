import { router } from "@routes/auth-router"
import express from "express"
import { StatusCodes } from "http-status-codes"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock do SecurityToolKit
vi.mock("security-toolkit", () => ({
    default: vi.fn().mockImplementation(() => ({
        checkersMethods: {
            validatePassword: vi.fn(() => ({ isValid: true })),
        },
    })),
}))

// Mock do jwtEncoder
vi.mock("../../../jwt/encode", () => ({
    jwtEncoder: vi.fn().mockResolvedValue("mock-jwt-token"),
}))

// Mock da classe Username (simplificado)
vi.mock("../../../classes/username", () => ({
    Username: class MockUsername {
        private value: string
        constructor(username: string) {
            this.value = username
        }
        async validate() {
            if (!this.value || this.value.length < 4) {
                throw new Error("Mock Validation Error: Invalid username")
            }
            if (this.value === "existinguser") {
                throw new Error("Mock Validation Error: Username exists")
            }
            return this.value
        }
        getValue() {
            return this.value
        }
    },
}))

// Mock dos helpers de senha
vi.mock("../../../helpers/encrypt-decrypt-password", () => ({
    EncriptedPassword: vi.fn().mockResolvedValue("hashed_password"),
    DecryptPassword: vi.fn().mockResolvedValue(true), // Mock padrão para senha correta
}))

// Mock do modelo User (nível superior)
vi.mock("@models/user/user-model")
// Mock dos modelos relacionados (nível superior)
vi.mock("@models/user/profilepicture-model")
vi.mock("@models/user/coordinate-model")
vi.mock("@models/preference/preference-model")
vi.mock("@models/user/statistic-model")
vi.mock("@models/user/contact-model")
vi.mock("@models/notification/notification_token-model") // Adicionado mock

const app = express()
app.use(express.json())
app.use("/auth", router)

describe("POST /sign-up", () => {
    let MockedUser: any
    let MockedProfilePicture: any
    let MockedCoordinate: any
    let MockedPreference: any
    let MockedStatistic: any
    let MockedContact: any

    beforeEach(async () => {
        vi.clearAllMocks()

        MockedUser = vi.mocked((await import("@models/user/user-model")).default, true)
        MockedProfilePicture = vi.mocked(
            (await import("@models/user/profilepicture-model")).default,
            true
        )
        MockedCoordinate = vi.mocked((await import("@models/user/coordinate-model")).default, true)
        MockedPreference = vi.mocked(
            (await import("@models/preference/preference-model")).default,
            true
        )
        MockedStatistic = vi.mocked((await import("@models/user/statistic-model")).default, true)
        MockedContact = vi.mocked((await import("@models/user/contact-model")).default, true)

        MockedProfilePicture.create.mockResolvedValue({} as any)
        MockedCoordinate.create.mockResolvedValue({} as any)
        MockedPreference.create.mockResolvedValue({} as any)
        MockedStatistic.create.mockResolvedValue({} as any)
        MockedContact.create.mockResolvedValue({} as any)
    })

    it("deve criar um novo usuário com sucesso", async () => {
        const mockUserIdBigInt = 123456789n
        const mockUserIdString = mockUserIdBigInt.toString() // ID como string

        const mockUser = {
            id: mockUserIdBigInt, // O mock de User.create ainda retorna BigInt
            username: "testuser",
            encrypted_password: "hashedpassword123",
            last_active_at: new Date(),
            last_login_at: new Date(),
        }

        MockedUser.create.mockResolvedValueOnce(mockUser as any)

        const response = await request(app).post("/auth/sign-up").send({
            username: "testuser",
            password: "validPassword123",
        })

        if (response.status !== 200) {
            console.error("Signup Error Response:", response.body)
        }

        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({
            session: {
                user: {
                    id: mockUserIdString, // Espera o ID como STRING
                    username: "testuser",
                    name: null,
                    description: null,
                    verifyed: false,
                },
                statistics: {
                    total_followers_num: 0,
                    total_likes_num: 0,
                    total_views_num: 0,
                },
                account: {
                    deleted: false,
                    blocked: false,
                    muted: false,
                    send_notification_emails: true,
                    jwtToken: "Bearer mock-jwt-token",
                    last_active_at: mockUser.last_active_at.toISOString(),
                    last_login_at: mockUser.last_login_at.toISOString(),
                },
            },
        })

        expect(MockedUser.create).toHaveBeenCalledWith({
            username: "testuser",
            encrypted_password: "hashed_password",
        })

        // Verifica se os creates relacionados foram chamados com o ID BigInt original
        expect(MockedProfilePicture.create).toHaveBeenCalledWith({ user_id: mockUserIdBigInt })
        expect(MockedCoordinate.create).toHaveBeenCalledWith({ user_id: mockUserIdBigInt })
        expect(MockedPreference.create).toHaveBeenCalledWith({ user_id: mockUserIdBigInt })
        expect(MockedStatistic.create).toHaveBeenCalledWith({ user_id: mockUserIdBigInt })
        // Contact.create espera Number, então a conversão é necessária
        expect(MockedContact.create).toHaveBeenCalledWith({ user_id: Number(mockUserIdBigInt) })
    })
})

// Novo describe block para sign-in
describe("POST /sign-in", () => {
    // Mocks específicos para sign-in
    let MockedUser: any
    let MockedProfilePicture: any
    let MockedStatistic: any
    let MockedNotificationToken: any
    let MockedPreference: any
    let MockedDecryptPassword: any

    beforeEach(async () => {
        vi.clearAllMocks()

        // Importa e configura os mocks necessários para sign-in
        MockedUser = vi.mocked((await import("@models/user/user-model")).default, true)
        MockedProfilePicture = vi.mocked(
            (await import("@models/user/profilepicture-model")).default,
            true
        )
        MockedStatistic = vi.mocked((await import("@models/user/statistic-model")).default, true)
        MockedNotificationToken = vi.mocked(
            (await import("@models/notification/notification_token-model")).default,
            true
        )
        MockedPreference = vi.mocked(
            (await import("@models/preference/preference-model")).default,
            true
        )
        MockedDecryptPassword = vi.mocked(
            (await import("../../helpers/encrypt-decrypt-password")).DecryptPassword,
            true
        )

        // Mocks padrão para os findOne
        MockedProfilePicture.findOne.mockResolvedValue({
            fullhd_resolution: "url1",
            tiny_resolution: "url2",
        } as any)
        MockedStatistic.findOne.mockResolvedValue({
            total_followers_num: 10,
            total_likes_num: 20,
            total_views_num: 30,
        } as any)
        MockedNotificationToken.findOne.mockResolvedValue({ token: "notif-token" } as any)
        MockedPreference.findOne.mockResolvedValue({
            app_language: "en",
            translation_language: "en",
            disable_autoplay: true,
        } as any)
        MockedDecryptPassword.mockResolvedValue(true) // Senha correta por padrão
    })

    it("deve autenticar um usuário com sucesso", async () => {
        const fakeExistingUser = {
            id: 987654321n,
            username: "signinuser",
            encrypted_password: "existing_hashed_password",
            name: "Sign In User",
            description: "User for sign in test",
            verifyed: true,
            deleted: false,
            blocked: false,
            muted: false,
            send_notification_emails: false,
            last_active_at: new Date(),
            last_login_at: new Date(),
        }

        MockedUser.findOne.mockResolvedValueOnce(fakeExistingUser as any)

        const response = await request(app).post("/auth/sign-in").send({
            username: "signinuser",
            password: "correctPassword",
        })

        if (response.status !== 200) {
            console.error("Signin Success Error Response:", response.body)
        }

        expect(response.status).toBe(200)
        expect(MockedUser.findOne).toHaveBeenCalledWith({ where: { username: "signinuser" } })
        expect(MockedDecryptPassword).toHaveBeenCalledWith({
            password1: "correctPassword",
            password2: fakeExistingUser.encrypted_password,
        })
        expect(response.body.session.user.id).toBe(fakeExistingUser.id.toString()) // Verifica se ID é string
        expect(response.body.session.user.username).toBe(fakeExistingUser.username)
        expect(response.body.session.account.jwtToken).toMatch(/^Bearer mock-jwt-token/)
        // Adicione mais verificações conforme necessário para profile_picture, statistics, etc.
        expect(response.body.session.user.profile_picture.tiny_resolution).toBe("url2")
        expect(response.body.session.statistics.total_followers_num).toBe(10)
        expect(response.body.session.preferences.content.disableAutoplay).toBe(true)
    })

    it("deve retornar erro se o usuário não for encontrado", async () => {
        MockedUser.findOne.mockResolvedValueOnce(null) // Simula usuário não encontrado

        const response = await request(app).post("/auth/sign-in").send({
            username: "nonexistentuser",
            password: "anypassword",
        })

        expect(response.status).toBe(400) // Ou o status code definido em ValidationError
        expect(response.body.message).toContain("Username not found")
        expect(MockedDecryptPassword).not.toHaveBeenCalled()
    })

    it("deve retornar erro se a senha estiver incorreta", async () => {
        const fakeExistingUser = {
            id: 987654321n,
            username: "signinuser",
            encrypted_password: "existing_hashed_password",
            // ... outros campos
        }
        MockedUser.findOne.mockResolvedValueOnce(fakeExistingUser as any)
        MockedDecryptPassword.mockResolvedValueOnce(false) // Simula senha incorreta

        const response = await request(app).post("/auth/sign-in").send({
            username: "signinuser",
            password: "wrongPassword",
        })

        expect(response.status).toBe(400) // Ou o status code definido em ValidationError
        expect(response.body.message).toContain("Incorrect Password")
        expect(MockedStatistic.findOne).not.toHaveBeenCalled() // Não deve buscar estatísticas se a senha falhar
    })
})

describe("Outras Rotas Auth", () => {
    // Variáveis de mock para este escopo
    let MockedUser: any
    let MockedDecryptPassword: any
    let MockedEncriptedPassword: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // Inicializar os mocks necessários para estas rotas
        MockedUser = vi.mocked((await import("@models/user/user-model")).default, true)
        const passwordHelpers = await import("../../helpers/encrypt-decrypt-password")
        MockedDecryptPassword = vi.mocked(passwordHelpers.DecryptPassword, true)
        MockedEncriptedPassword = vi.mocked(passwordHelpers.EncriptedPassword, true)

        // Resetar mocks padrões para este grupo de testes
        MockedDecryptPassword.mockResolvedValue(false) // Default: senha nova != senha atual
        MockedEncriptedPassword.mockResolvedValue("new_hashed_password")
        MockedUser.update.mockResolvedValue([1] as any) // Mock padrão para update
    })

    // Testes para POST /username-already-in-use
    describe("POST /username-already-in-use", () => {
        it("deve retornar true se o username estiver em uso", async () => {
            MockedUser.findOne.mockResolvedValueOnce({ username: "existinguser" } as any)

            const response = await request(app)
                .post("/auth/username-already-in-use")
                .send({ username: "existinguser" })

            expect(response.status).toBe(StatusCodes.ACCEPTED)
            expect(response.body.enable_to_use).toBe(false)
            expect(response.body.message).toContain("already in use")
            expect(MockedUser.findOne).toHaveBeenCalledWith({
                where: { username: "existinguser" },
                attributes: ["username"],
            })
        })

        it("deve retornar false se o username NÃO estiver em uso", async () => {
            MockedUser.findOne.mockResolvedValueOnce(null)

            const response = await request(app)
                .post("/auth/username-already-in-use")
                .send({ username: "newuser" })

            expect(response.status).toBe(StatusCodes.ACCEPTED)
            expect(response.body.enable_to_use).toBe(true)
            expect(response.body.message).toContain("available for use")
            expect(MockedUser.findOne).toHaveBeenCalledWith({
                where: { username: "newuser" },
                attributes: ["username"],
            })
        })
    })

    // Testes para PUT /change-password
    describe("PUT /change-password", () => {
        const userIdToChange = 12345
        const currentPasswordHash = "current_hashed_password"

        beforeEach(() => {
            // Mock padrão para findOne em change-password
            MockedUser.findOne.mockResolvedValue({
                id: userIdToChange,
                encrypted_password: currentPasswordHash,
            } as any)
            // Mock User.update já configurado no beforeEach externo
        })

        it("deve alterar a senha com sucesso", async () => {
            const newPassword = "newValidPassword123"
            MockedDecryptPassword.mockResolvedValueOnce(false)
            const response = await request(app).put("/auth/change-password").send({
                user_id: userIdToChange,
                password_input: newPassword,
            })
            expect(response.status).toBe(StatusCodes.NO_CONTENT)
            expect(MockedUser.findOne).toHaveBeenCalledWith({
                where: { id: userIdToChange },
                attributes: ["encrypted_password", "old_encrypted_password"],
            })
            expect(MockedDecryptPassword).toHaveBeenCalledWith({
                password1: newPassword,
                password2: currentPasswordHash,
            })
            expect(MockedUser.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    encrypted_password: "new_hashed_password",
                    old_encrypted_password: currentPasswordHash,
                    last_password_updated_at: expect.any(Date),
                }),
                { where: { id: userIdToChange } }
            )
        })

        it("deve retornar erro se a nova senha for igual à atual", async () => {
            const samePassword = "currentPassword123"
            MockedDecryptPassword.mockResolvedValueOnce(true)
            const response = await request(app).put("/auth/change-password").send({
                user_id: userIdToChange,
                password_input: samePassword,
            })
            expect(response.status).toBe(400)
            expect(response.body.message).toContain("cannot be the same as your current one")
            expect(MockedUser.update).not.toHaveBeenCalled()
        })

        it("deve retornar erro se o usuário não for encontrado", async () => {
            MockedUser.findOne.mockResolvedValueOnce(null)
            const response = await request(app).put("/auth/change-password").send({
                user_id: 999999999,
                password_input: "anyNewPassword",
            })
            expect(response.status).toBe(500)
            expect(MockedDecryptPassword).not.toHaveBeenCalled()
            expect(MockedUser.update).not.toHaveBeenCalled()
        })
    })
})
