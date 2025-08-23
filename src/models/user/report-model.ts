import { DataTypes, Model, Sequelize } from "sequelize"

interface ReportAttributes {
    id?: bigint
    user_id: bigint
    reported_content_id: bigint
    reported_content_type: string
    report_type: string
}

export default class Report extends Model<ReportAttributes> implements ReportAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public reported_content_id!: bigint
    public reported_content_type!: string
    public report_type!: string

    static initialize(sequelize: Sequelize) {
        Report.init(
            {
                id: {
                    type: DataTypes.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                reported_content_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                reported_content_type: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                report_type: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                modelName: "Report",
                tableName: "reports",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }
} 