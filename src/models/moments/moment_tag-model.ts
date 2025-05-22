import { DataTypes, Model, Sequelize } from "sequelize"

interface MomentTagAttributes {
    id?: bigint
    moment_id?: bigint
    tag_id?: bigint
}

export default class MomentTag extends Model<MomentTagAttributes> implements MomentTagAttributes {
    public readonly id!: bigint
    public moment_id?: bigint
    public tag_id?: bigint

    static initialize(sequelize: Sequelize) {
        MomentTag.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
                tag_id: {
                    type: DataTypes.BIGINT,
                    allowNull: true,
                },
            },
            {
                sequelize,
                modelName: "MomentTag",
                tableName: "moment_tags",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.Moment, { foreignKey: "moment_id", as: "moment" })
        this.belongsTo(models.Tag, { foreignKey: "tag_id", as: "tag" })
    }
} 