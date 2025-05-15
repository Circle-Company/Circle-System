import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

// Declaração dos mocks no topo do arquivo
const mockFindAll = vi.fn()
const mockCount = vi.fn()

// Mocks dos modelos
vi.mock('../../models/user/user-model', () => ({
    default: {
        findAll: () => mockFindAll(),
        count: () => mockCount()
    }
}))

vi.mock('../../models/user/coordinate-model', () => ({
    default: {
        findAll: () => mockFindAll()
    }
}))

vi.mock('../../models/user/profilepicture-model', () => ({
    default: {
        findAll: () => mockFindAll()
    }
}))

vi.mock('../../models/user/statistic-model', () => ({
    default: {
        findAll: () => mockFindAll()
    }
}))

vi.mock('../../models/user/user-block-model', () => ({
    default: {
        findAll: () => mockFindAll()
    }
}))

vi.mock('../../models/user/user-mute-model', () => ({
    default: {
        findAll: () => mockFindAll()
    }
}))

// Importação do controller após os mocks
import { findNearbyUsers } from './near-find-controller'

const app = express()
app.use(express.json())
app.post('/near/users/find', (req, res, next) => {
    req.user_id = BigInt(1)
    next()
}, findNearbyUsers)

describe('POST /near/users/find', () => {
    const mockUsers = [
        {
            id: 1,
            name: 'Usuário 1',
            username: 'user1',
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            get: (key: string) => {
                const data: Record<string, any> = {
                    id: 1,
                    name: 'Usuário 1',
                    username: 'user1',
                    created_at: new Date(),
                    updated_at: new Date(),
                    deleted_at: null,
                    distance_km: '5.00'
                }
                return data[key]
            }
        },
        {
            id: 2,
            name: 'Usuário 2',
            username: 'user2',
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            get: (key: string) => {
                const data: Record<string, any> = {
                    id: 2,
                    name: 'Usuário 2',
                    username: 'user2',
                    created_at: new Date(),
                    updated_at: new Date(),
                    deleted_at: null,
                    distance_km: '10.00'
                }
                return data[key]
            }
        }
    ]

    const mockCoordinates = [
        {
            id: 1,
            user_id: 1,
            latitude: -23.550520,
            longitude: -46.633308,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            user_id: 2,
            latitude: -23.560520,
            longitude: -46.643308,
            created_at: new Date(),
            updated_at: new Date()
        }
    ]

    const mockProfilePictures = [
        {
            id: 1,
            user_id: 1,
            url: 'https://example.com/pic1.jpg',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            user_id: 2,
            url: 'https://example.com/pic2.jpg',
            created_at: new Date(),
            updated_at: new Date()
        }
    ]

    const mockStatistics = [
        {
            id: 1,
            user_id: 1,
            followers_count: 100,
            following_count: 50,
            posts_count: 25,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            user_id: 2,
            followers_count: 200,
            following_count: 100,
            posts_count: 50,
            created_at: new Date(),
            updated_at: new Date()
        }
    ]

    const mockBlocks: any[] = []
    const mockMutes: any[] = []

    beforeEach(() => {
        // Configurar os mocks dos modelos
        mockFindAll.mockResolvedValue(mockUsers.map(user => ({
            ...user,
            get: () => ({
                id: user.id,
                username: user.username,
                name: user.name,
                deleted_at: user.deleted_at,
                profile_pictures: [mockProfilePictures.find(pic => pic.user_id === user.id)],
                statistics: [mockStatistics.find(stat => stat.user_id === user.id)],
                distance_km: user.get('distance_km')
            })
        })))
        mockCount.mockResolvedValue(2)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('deve retornar usuários próximos dentro do raio especificado', async () => {
        const response = await request(app)
            .post('/near/users/find')
            .send({
                latitude: -23.550520,
                longitude: -46.633308,
                radius: 10
            })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('users')
        expect(response.body).toHaveProperty('pagination')
        expect(response.body.users).toHaveLength(2)
        expect(response.body.users[0]).toHaveProperty('distance_km')
    })

    it('deve retornar erro quando as coordenadas não são fornecidas', async () => {
        const response = await request(app)
            .post('/near/users')
            .send({})

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error')
    })

    it('deve retornar erro quando as coordenadas são inválidas', async () => {
        const response = await request(app)
            .post('/near/users')
            .send({
                latitude: 'invalid',
                longitude: -46.633308
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error')
    })

    it('deve respeitar os parâmetros de paginação', async () => {
        // Criar um mock com a estrutura correta
        const singleUser = {
            ...mockUsers[0],
            get: () => ({
                id: mockUsers[0].id,
                username: mockUsers[0].username,
                name: mockUsers[0].name,
                deleted_at: null,
                profile_pictures: [mockProfilePictures.find(pic => pic.user_id === mockUsers[0].id)],
                statistics: [mockStatistics.find(stat => stat.user_id === mockUsers[0].id)],
                distance_km: '5.00'
            })
        }

        mockFindAll.mockResolvedValue([singleUser])
        mockCount.mockResolvedValue(1)

        const response = await request(app)
            .post('/near/users/find?page=1&limit=1')
            .send({
                latitude: -23.550520,
                longitude: -46.633308
            })

        expect(response.status).toBe(200)
        expect(response.body.users).toHaveLength(1)
        expect(response.body.pagination).toEqual({
            total: 1,
            page: 1,
            limit: 1,
            total_pages: 1
        })
    })

    it('deve filtrar usuários bloqueados, deletados e mutados', async () => {
        // Usuário normal
        const normalUser = {
            ...mockUsers[0],
            get: () => ({
                id: mockUsers[0].id,
                username: mockUsers[0].username,
                name: mockUsers[0].name,
                deleted_at: null,
                profile_pictures: [mockProfilePictures.find(pic => pic.user_id === mockUsers[0].id)],
                statistics: [mockStatistics.find(stat => stat.user_id === mockUsers[0].id)],
                distance_km: '5.00'
            })
        }

        // Usuário deletado
        const deletedUser = {
            ...mockUsers[1],
            deleted_at: new Date(),
            get: () => ({
                id: mockUsers[1].id,
                username: mockUsers[1].username,
                name: mockUsers[1].name,
                deleted_at: new Date(), // Este é o valor importante
                profile_pictures: [mockProfilePictures.find(pic => pic.user_id === mockUsers[1].id)],
                statistics: [mockStatistics.find(stat => stat.user_id === mockUsers[1].id)],
                distance_km: '10.00'
            })
        }

        // Mock para retornar ambos os usuários
        mockFindAll.mockResolvedValue([normalUser, deletedUser])
        mockCount.mockResolvedValue(2)

        const response = await request(app)
            .post('/near/users')
            .send({
                latitude: -23.550520,
                longitude: -46.633308
            })

        expect(response.status).toBe(200)
        expect(response.body.users).toHaveLength(1)
        expect(response.body.users[0].id).toBe(1)
    })

    it('deve usar raio padrão de 50km quando não especificado', async () => {
        const response = await request(app)
            .post('/near/users/find')
            .send({
                latitude: -23.550520,
                longitude: -46.633308
            })

        expect(response.status).toBe(200)
        expect(response.body.users).toHaveLength(2)
    })

    it('deve limitar o raio máximo a 100km', async () => {
        const response = await request(app)
            .post('/near/users/find')
            .send({
                latitude: -23.550520,
                longitude: -46.633308,
                radius: 200
            })

        expect(response.status).toBe(200)
        expect(response.body.users).toHaveLength(2)
    })
}) 