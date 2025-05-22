import { DataTypes, Model, Sequelize } from "sequelize"

interface MomentMidiaAttributes {
    id?: bigint
    content_type: string
    nhd_resolution: string
    fullhd_resolution: string
    moment_id?: bigint
}

export default class MomentMidia extends Model<MomentMidiaAttributes> implements MomentMidiaAttributes {
    public readonly id!: bigint
    public content_type!: string
    public nhd_resolution!: string
    public fullhd_resolution!: string
    public moment_id?: bigint

    static initialize(sequelize: Sequelize) {
        MomentMidia.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                content_type: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                nhd_resolution: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                fullhd_resolution: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: "MomentMidia",
                tableName: "moment_midias",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.Moment, { foreignKey: "moment_id", as: "moment" })
    }
} 