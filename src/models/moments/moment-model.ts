import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
} from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

class Moment extends Model<InferAttributes<Moment>, InferCreationAttributes<Moment>> {
    declare id: CreationOptional<bigint>
    declare description: CreationOptional<string | null>
    declare visible: CreationOptional<boolean>
    declare deleted: CreationOptional<boolean>
    declare blocked: CreationOptional<boolean>
    declare user_id: bigint

    static initialize(sequelize: Sequelize): void {
        Moment.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: () => snowflake.generate(),
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                    references: {
                        model: "users",
                        key: "id",
                    },
                },
                description: {
                    type: DataTypes.STRING(300),
                    allowNull: true,
                },
                visible: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
                deleted: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                blocked: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
            },
            {
                sequelize,
                tableName: "moments",
                timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
            }
        )

        const createIndexOnCreatedAt = async () => {
            try {
                // Check if the index already exists
                const [result] = await sequelize.query(`
          SHOW INDEX FROM moments WHERE Key_name = 'index_created_at';
        `)

                // Create the index if it does not exist
                if ((result as any[]).length === 0) {
                    await sequelize.query(`
            ALTER TABLE moments ADD INDEX index_created_at (created_at);
          `)
                }
            } catch (error) {
                console.error("Error creating index on created_at:", error)
            }
        }

        createIndexOnCreatedAt()
    }

    static associate(models: any): void {
        this.hasOne(models.MomentInteraction, {
            foreignKey: "moment_id",
            as: "moment_interactions",
        })
        this.hasOne(models.MomentMidia, {
            foreignKey: "moment_id",
            as: "moment_midias",
        })
        this.hasOne(models.MomentMetadata, {
            foreignKey: "moment_id",
            as: "moment_metadatas",
        })
        this.hasOne(models.MomentStatistic, {
            foreignKey: "moment_id",
            as: "moment_statistics",
        })
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
        this.hasMany(models.MomentComment, {
            foreignKey: "moment_id",
            as: "moment_comments",
        })
        this.hasMany(models.MemoryMoment, {
            foreignKey: "moment_id",
            as: "memory_moments",
        })
        this.belongsToMany(models.Tag, {
            through: "MomentTag",
            foreignKey: "moment_id",
            as: "tags",
        })
        this.belongsToMany(models.Memory, {
            through: "MemoryMoment",
            foreignKey: "moment_id",
            as: "memories",
        })
        this.hasMany(models.Like, {
            foreignKey: "liked_moment_id",
            as: "likes",
        })
        this.hasMany(models.Notification, { foreignKey: "moment_id" })
    }
}

export default Moment
