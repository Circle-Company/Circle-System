import { DataTypes, Model, Sequelize } from "sequelize"
import { ClusterInfo, EmbeddingVector } from "../core/types"

interface ClusterAttributes {
    id: string
    name: string
    centroid: string // JSON stringificado do EmbeddingVector
    topics: string[] // Array de tópicos
    memberIds: string[] // Array de IDs de usuários
    activeTimeOfDay: number[] // [início, fim] em horas
    activeDaysOfWeek: number[] // Dias ativos
    preferredLocations: string[] // Localizações
    languages: string[] // Idiomas
    size: number
    density: number
    metadata: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface ClusterCreationAttributes
    extends Omit<ClusterAttributes, "id" | "createdAt" | "updatedAt"> {
    id?: string
}

class Cluster
    extends Model<ClusterAttributes, ClusterCreationAttributes>
    implements ClusterAttributes
{
    public id!: string
    public name!: string
    public centroid!: string
    public topics!: string[]
    public memberIds!: string[]
    public activeTimeOfDay!: number[]
    public activeDaysOfWeek!: number[]
    public preferredLocations!: string[]
    public languages!: string[]
    public size!: number
    public density!: number
    public metadata!: Record<string, any>

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // Método para converter para o formato ClusterInfo
    public toClusterInfo(): ClusterInfo {
        const centroidData = JSON.parse(this.centroid) as EmbeddingVector
        return {
            id: this.id,
            name: this.name,
            centroid: centroidData,
            topics: this.topics,
            memberIds: this.memberIds,
            activeTimeOfDay:
                this.activeTimeOfDay.length === 2
                    ? [this.activeTimeOfDay[0], this.activeTimeOfDay[1]]
                    : undefined,
            activeDaysOfWeek: this.activeDaysOfWeek,
            preferredLocations: this.preferredLocations,
            languages: this.languages,
            size: this.size,
            density: this.density,
            metadata: this.metadata,
        }
    }

    // Método estático para inicializar o modelo
    public static initialize(sequelize: Sequelize): void {
        Cluster.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                centroid: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                    get() {
                        const rawValue = this.getDataValue("centroid")
                        return rawValue ? JSON.parse(rawValue) : null
                    },
                    set(value: EmbeddingVector) {
                        this.setDataValue("centroid", JSON.stringify(value))
                    },
                },
                topics: {
                    type: DataTypes.ARRAY(DataTypes.STRING),
                    defaultValue: [],
                },
                memberIds: {
                    type: DataTypes.ARRAY(DataTypes.STRING),
                    defaultValue: [],
                },
                activeTimeOfDay: {
                    type: DataTypes.ARRAY(DataTypes.INTEGER),
                    defaultValue: [0, 23],
                },
                activeDaysOfWeek: {
                    type: DataTypes.ARRAY(DataTypes.INTEGER),
                    defaultValue: [0, 1, 2, 3, 4, 5, 6],
                },
                preferredLocations: {
                    type: DataTypes.ARRAY(DataTypes.STRING),
                    defaultValue: [],
                },
                languages: {
                    type: DataTypes.ARRAY(DataTypes.STRING),
                    defaultValue: [],
                },
                size: {
                    type: DataTypes.INTEGER,
                    defaultValue: 0,
                },
                density: {
                    type: DataTypes.FLOAT,
                    defaultValue: 0,
                },
                metadata: {
                    type: DataTypes.JSONB,
                    defaultValue: {},
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: "swipe_clusters",
                timestamps: true,
            }
        )
    }

    // Método para definir associações
    public static associate(models: any): void {
        // Nenhuma associação no momento
    }
}

export default Cluster
