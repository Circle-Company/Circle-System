import { DataTypes, Model, Sequelize } from "sequelize"

interface MomentMetadataAttributes {
    id?: bigint
    duration: number
    file_name: string
    file_size: number
    file_type: string
    resolution_width: number
    resolution_height: number
    moment_id?: bigint
}

export default class MomentMetadata extends Model<MomentMetadataAttributes> implements MomentMetadataAttributes {
    public readonly id!: bigint
    public duration!: number
    public file_name!: string
    public file_size!: number
    public file_type!: string
    public resolution_width!: number
    public resolution_height!: number
    public moment_id?: bigint

    static initialize(sequelize: Sequelize) {
        MomentMetadata.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                duration: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                file_name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                file_size: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                file_type: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                resolution_width: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                resolution_height: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: "MomentMetadata",
                tableName: "moment_metadatas",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.Moment, { foreignKey: "moment_id", as: "moment" })
    }
} 