const express = require("express")
const request = require("supertest")
const { CheckUserAccountStatus } = require("../middlewares/CheckUserAccountStatus")
const UserModel = require("../models/user/user-model.js") // Renomeie aqui

// Mock do modelo de usuário
jest.mock("../models/user/user-model")

const app = express()

// Middleware para simular a rota
app.use("/user/:username", CheckUserAccountStatus, (req, res) => {
    res.status(200).send("User is valid")
})

describe("CheckUserAccountStatus Middleware", () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should return 404 if the user is not found", async () => {
        UserModel.findOne.mockResolvedValue(null) // Simula usuário não encontrado

        const response = await request(app).get("/user/nonexistentuser")

        expect(response.status).toBe(404)
        expect(response.body.error).toBe("User not found.")
    })

    it("should return 404 if the account is blocked", async () => {
        UserModel.findOne.mockResolvedValue({
            blocked: true,
            deleted: false,
        }) // Simula usuário bloqueado

        const response = await request(app).get("/user/blockeduser")

        expect(response.status).toBe(404)
        expect(response.body.error).toBe(
            "This account has been blocked for violating Circle's terms of use, privacy, or community guidelines."
        )
    })

    it("should return 404 if the account is deleted", async () => {
        UserModel.findOne.mockResolvedValue({
            blocked: false,
            deleted: true,
        }) // Simula usuário excluído

        const response = await request(app).get("/user/deleteduser")

        expect(response.status).toBe(404)
        expect(response.body.error).toBe("It looks like this account was deleted from Circle.")
    })

    it("should call next if the user is valid", async () => {
        UserModel.findOne.mockResolvedValue({
            blocked: false,
            deleted: false,
            username: "validuser",
        }) // Simula usuário válido

        const response = await request(app).get("/user/validuser")

        expect(response.status).toBe(200)
        expect(response.text).toBe("User is valid")
    })
})
