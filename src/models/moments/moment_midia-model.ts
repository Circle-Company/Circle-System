import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from "sequelize"

class MomentMidia extends Model<
    InferAttributes<MomentMidia>,
    InferCreationAttributes<MomentMidia>
> {
    declare id: CreationOptional<bigint>
    declare moment_id: bigint
    declare content_type: string
    declare nhd_resolution: string
    declare fullhd_resolution: string
    declare created_at?: CreationOptional<Date>
    declare updated_at?: CreationOptional<Date>

    static initialize(sequelize: Sequelize): void {
        MomentMidia.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                },
                moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: "moments",
                        key: "id",
                    },
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
            },
            {
                sequelize,
                tableName: "moment_midias",
                timestamps: true, // Adiciona automaticamente `createdAt` e `updatedAt`
            }
        )
    }

    static associate(models: any): void {
        this.belongsTo(models.Moment, {
            foreignKey: "moment_id",
            as: "moment",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        })
    }
}

export default MomentMidia
