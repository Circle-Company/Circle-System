import { DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from "sequelize"
import SnowflakeID from "snowflake-id"

const snowflake = new SnowflakeID()

class Moment extends Model<InferAttributes<Moment>, InferCreationAttributes<Moment>> {
    declare id: number // Unique identifier for each moment
    declare description: string | null // Moment description
    declare visible: boolean // Visibility flag
    declare deleted: boolean // Deletion flag
    declare blocked: boolean // Blocked flag
    declare user_id: number

    static initialize(sequelize: Sequelize): void {
        Moment.init(
            {
                id: {
                    type: DataTypes.NUMBER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                user_id: {
                    type: DataTypes.NUMBER,
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
        // Uncomment and adjust if necessary
        // this.hasMany(models.Notification, { foreignKey: "moment_id" });
    }
}

export default Moment
