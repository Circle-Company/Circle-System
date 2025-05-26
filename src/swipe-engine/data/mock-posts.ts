import { Candidate, EmbeddingVector, InteractionType, UserEmbedding } from "../core/types"

export const createMockEmbedding = (): EmbeddingVector => ({
    dimension: 128,
    values: Array(128).fill(0).map(() => Math.random() * 2 - 1),
    createdAt: new Date(),
    updatedAt: new Date(),
})

export const mockPosts: Candidate[] = [
    {
        id: "1",
        user_id: "101",
        created_at: new Date("2024-05-01T10:00:00Z"),
        tags: ["tecnologia", "programação", "desenvolvimento"],
        location: "São Paulo",
        statistics: {
            likes: 150,
            comments: 45,
            shares: 30,
            views: 1200,
        },
        embedding: {
            userId: "101",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["tecnologia", "programação"],
                engagement: 0.85,
            },
        },
    },
    {
        id: "2",
        user_id: "102",
        created_at: new Date("2024-05-02T15:30:00Z"),
        tags: ["esportes", "futebol", "saúde"],
        location: "Rio de Janeiro",
        statistics: {
            likes: 200,
            comments: 60,
            shares: 45,
            views: 2500,
        },
        embedding: {
            userId: "102",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["esportes", "saúde"],
                engagement: 0.92,
            },
        },
    },
    {
        id: "3",
        user_id: "103",
        created_at: new Date("2024-05-03T20:15:00Z"),
        tags: ["arte", "música", "cultura"],
        location: "Belo Horizonte",
        statistics: {
            likes: 180,
            comments: 55,
            shares: 35,
            views: 1800,
        },
        embedding: {
            userId: "103",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["arte", "cultura"],
                engagement: 0.88,
            },
        },
    },
    {
        id: "4",
        user_id: "104",
        created_at: new Date("2024-05-04T09:45:00Z"),
        tags: ["gastronomia", "culinária", "receitas"],
        location: "Curitiba",
        statistics: {
            likes: 320,
            comments: 89,
            shares: 156,
            views: 4500,
        },
        embedding: {
            userId: "104",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["gastronomia", "culinária"],
                engagement: 0.95,
            },
        },
    },
    {
        id: "5",
        user_id: "105",
        created_at: new Date("2024-05-05T14:20:00Z"),
        tags: ["viagens", "turismo", "aventura"],
        location: "Salvador",
        statistics: {
            likes: 450,
            comments: 120,
            shares: 230,
            views: 6800,
        },
        embedding: {
            userId: "105",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["viagens", "turismo"],
                engagement: 0.98,
            },
        },
    },
    {
        id: "6",
        user_id: "106",
        created_at: new Date("2024-05-06T11:30:00Z"),
        tags: ["fotografia", "arte", "design"],
        location: "Florianópolis",
        statistics: {
            likes: 280,
            comments: 75,
            shares: 95,
            views: 3200,
        },
        embedding: {
            userId: "106",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["fotografia", "arte"],
                engagement: 0.87,
            },
        },
    },
    {
        id: "7",
        user_id: "107",
        created_at: new Date("2024-05-07T16:45:00Z"),
        tags: ["negócios", "empreendedorismo", "startup"],
        location: "São Paulo",
        statistics: {
            likes: 190,
            comments: 65,
            shares: 45,
            views: 2800,
        },
        embedding: {
            userId: "107",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["negócios", "empreendedorismo"],
                engagement: 0.82,
            },
        },
    },
    {
        id: "8",
        user_id: "108",
        created_at: new Date("2024-05-08T13:15:00Z"),
        tags: ["saúde", "bem-estar", "meditação"],
        location: "Rio de Janeiro",
        statistics: {
            likes: 410,
            comments: 110,
            shares: 180,
            views: 5200,
        },
        embedding: {
            userId: "108",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["saúde", "bem-estar"],
                engagement: 0.94,
            },
        },
    },
    {
        id: "9",
        user_id: "109",
        created_at: new Date("2024-05-09T10:00:00Z"),
        tags: ["educação", "tecnologia", "inovação"],
        location: "Belo Horizonte",
        statistics: {
            likes: 230,
            comments: 85,
            shares: 65,
            views: 3500,
        },
        embedding: {
            userId: "109",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["educação", "tecnologia"],
                engagement: 0.89,
            },
        },
    },
    {
        id: "10",
        user_id: "110",
        created_at: new Date("2024-05-10T15:30:00Z"),
        tags: ["música", "festivais", "shows"],
        location: "Porto Alegre",
        statistics: {
            likes: 380,
            comments: 95,
            shares: 210,
            views: 4800,
        },
        embedding: {
            userId: "110",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["música", "festivais"],
                engagement: 0.96,
            },
        },
    },
    {
        id: "11",
        user_id: "111",
        created_at: new Date("2024-05-11T12:45:00Z"),
        tags: ["cinema", "filmes", "crítica"],
        location: "São Paulo",
        statistics: {
            likes: 290,
            comments: 78,
            shares: 120,
            views: 3900,
        },
        embedding: {
            userId: "111",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["cinema", "filmes"],
                engagement: 0.91,
            },
        },
    },
    {
        id: "12",
        user_id: "112",
        created_at: new Date("2024-05-12T17:20:00Z"),
        tags: ["literatura", "livros", "escrita"],
        location: "Recife",
        statistics: {
            likes: 260,
            comments: 72,
            shares: 88,
            views: 3100,
        },
        embedding: {
            userId: "112",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["literatura", "livros"],
                engagement: 0.86,
            },
        },
    },
    {
        id: "13",
        user_id: "113",
        created_at: new Date("2024-05-13T14:00:00Z"),
        tags: ["games", "e-sports", "tecnologia"],
        location: "Brasília",
        statistics: {
            likes: 420,
            comments: 115,
            shares: 195,
            views: 5500,
        },
        embedding: {
            userId: "113",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["games", "e-sports"],
                engagement: 0.97,
            },
        },
    },
    {
        id: "14",
        user_id: "114",
        created_at: new Date("2024-05-14T11:15:00Z"),
        tags: ["moda", "estilo", "tendências"],
        location: "Rio de Janeiro",
        statistics: {
            likes: 350,
            comments: 92,
            shares: 165,
            views: 4200,
        },
        embedding: {
            userId: "114",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["moda", "estilo"],
                engagement: 0.93,
            },
        },
    },
    {
        id: "15",
        user_id: "115",
        created_at: new Date("2024-05-15T16:30:00Z"),
        tags: ["ciência", "pesquisa", "inovação"],
        location: "São Paulo",
        statistics: {
            likes: 210,
            comments: 68,
            shares: 75,
            views: 2900,
        },
        embedding: {
            userId: "115",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["ciência", "pesquisa"],
                engagement: 0.84,
            },
        },
    },
    {
        id: "16",
        user_id: "116",
        created_at: new Date("2024-05-16T13:45:00Z"),
        tags: ["esportes", "corrida", "maratona"],
        location: "Curitiba",
        statistics: {
            likes: 330,
            comments: 88,
            shares: 145,
            views: 4100,
        },
        embedding: {
            userId: "116",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["esportes", "corrida"],
                engagement: 0.90,
            },
        },
    },
    {
        id: "17",
        user_id: "117",
        created_at: new Date("2024-05-17T10:30:00Z"),
        tags: ["arquitetura", "design", "decoração"],
        location: "Belo Horizonte",
        statistics: {
            likes: 270,
            comments: 76,
            shares: 110,
            views: 3400,
        },
        embedding: {
            userId: "117",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["arquitetura", "design"],
                engagement: 0.88,
            },
        },
    },
    {
        id: "18",
        user_id: "118",
        created_at: new Date("2024-05-18T15:15:00Z"),
        tags: ["teatro", "artes cênicas", "cultura"],
        location: "São Paulo",
        statistics: {
            likes: 240,
            comments: 70,
            shares: 95,
            views: 3000,
        },
        embedding: {
            userId: "118",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["teatro", "artes cênicas"],
                engagement: 0.85,
            },
        },
    },
    {
        id: "19",
        user_id: "119",
        created_at: new Date("2024-05-19T12:00:00Z"),
        tags: ["jardinagem", "plantas", "natureza"],
        location: "Florianópolis",
        statistics: {
            likes: 360,
            comments: 94,
            shares: 175,
            views: 4400,
        },
        embedding: {
            userId: "119",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["jardinagem", "plantas"],
                engagement: 0.92,
            },
        },
    },
    {
        id: "20",
        user_id: "120",
        created_at: new Date("2024-05-20T17:45:00Z"),
        tags: ["tecnologia", "programação", "desenvolvimento"],
        location: "Porto Alegre",
        statistics: {
            likes: 400,
            comments: 105,
            shares: 190,
            views: 5000,
        },
        embedding: {
            userId: "120",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["tecnologia", "programação"],
                engagement: 0.96,
            },
        },
    },
    {
        id: "21",
        user_id: "121",
        created_at: new Date("2024-05-21T14:30:00Z"),
        tags: ["culinária", "receitas", "gastronomia"],
        location: "Salvador",
        statistics: {
            likes: 440,
            comments: 118,
            shares: 220,
            views: 6000,
        },
        embedding: {
            userId: "121",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["culinária", "receitas"],
                engagement: 0.98,
            },
        },
    },
    {
        id: "22",
        user_id: "122",
        created_at: new Date("2024-05-22T11:45:00Z"),
        tags: ["fotografia", "natureza", "paisagens"],
        location: "Rio de Janeiro",
        statistics: {
            likes: 380,
            comments: 98,
            shares: 180,
            views: 4800,
        },
        embedding: {
            userId: "122",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["fotografia", "natureza"],
                engagement: 0.95,
            },
        },
    },
    {
        id: "23",
        user_id: "123",
        created_at: new Date("2024-05-23T16:00:00Z"),
        tags: ["música", "instrumentos", "produção"],
        location: "São Paulo",
        statistics: {
            likes: 320,
            comments: 86,
            shares: 150,
            views: 4200,
        },
        embedding: {
            userId: "123",
            vector: createMockEmbedding(),
            metadata: {
                interests: ["música", "produção"],
                engagement: 0.93,
            },
        },
    }
]

export const mockInteractions: Array<{
    userId: string
    entityId: string
    type: InteractionType
    timestamp: Date
    metadata?: Record<string, any>
}> = [
    {
        userId: "201",
        entityId: "1",
        type: "like",
        timestamp: new Date("2024-05-01T11:00:00Z"),
        metadata: {
            engagementTime: 45,
            percentWatched: 100,
        },
    },
    {
        userId: "201",
        entityId: "2",
        type: "long_view",
        timestamp: new Date("2024-05-02T16:00:00Z"),
        metadata: {
            engagementTime: 120,
            percentWatched: 85,
        },
    },
    {
        userId: "201",
        entityId: "3",
        type: "share",
        timestamp: new Date("2024-05-03T21:00:00Z"),
        metadata: {
            engagementTime: 60,
            percentWatched: 90,
        },
    },
]

export const mockUserProfile = {
    userId: "201",
    interests: ["tecnologia", "esportes", "arte"],
    demographics: {
        ageRange: "25-34",
        location: "São Paulo",
        language: "pt-BR",
    },
    preferences: {
        contentTypes: ["posts", "videos", "articles"],
        notificationSettings: {
            email: true,
            push: true,
        },
    },
} 