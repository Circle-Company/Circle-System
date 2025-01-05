import { DataTypes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

class Tag extends Model {
    public readonly id!: number
    public title!: string

    static initialize(sequelize: Sequelize): typeof Tag {
        return Tag.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: false,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
                },
                title: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "Tag",
                tableName: "tags",
                timestamps: true, // Adicione caso precise de `createdAt` e `updatedAt`
            }
        )
    }

    static associate(models: any): void {
        this.belongsToMany(models.MomentTag, {
            through: "MomentTag",
            foreignKey: "tag_id",
            otherKey: "moment_id",
            as: "momentTags",
        })
    }
}

export default Tag
