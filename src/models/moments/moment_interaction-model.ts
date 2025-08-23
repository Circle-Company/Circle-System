import { DataTypes, Model, Sequelize } from "sequelize"

interface MomentInteractionAttributes {
    id?: bigint
    user_id: bigint
    moment_owner_id: bigint
    moment_id: bigint
    like?: boolean
    share?: boolean
    click_into_moment?: boolean
    watch_time?: number
    click_profile?: boolean
    comment?: boolean
    like_comment?: boolean
    pass_to_next?: boolean
    show_less_often?: boolean
    report?: boolean
    negative_interaction_rate?: number
    positive_interaction_rate?: number
}

export default class MomentInteraction extends Model<MomentInteractionAttributes> implements MomentInteractionAttributes {
    public readonly id!: bigint
    public user_id!: bigint
    public moment_owner_id!: bigint
    public moment_id!: bigint
    public like?: boolean
    public share?: boolean
    public click_into_moment?: boolean
    public watch_time?: number
    public click_profile?: boolean
    public comment?: boolean
    public like_comment?: boolean
    public pass_to_next?: boolean
    public show_less_often?: boolean
    public report?: boolean
    public negative_interaction_rate?: number
    public positive_interaction_rate?: number

    static initialize(sequelize: Sequelize) {
        MomentInteraction.init(
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
                moment_owner_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                moment_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
                like: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                share: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                click_into_moment: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                watch_time: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    defaultValue: 0,
                },
                click_profile: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                comment: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                like_comment: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                pass_to_next: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                show_less_often: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                report: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                negative_interaction_rate: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    defaultValue: 0,
                },
                positive_interaction_rate: {
                    type: DataTypes.FLOAT,
                    allowNull: true,
                    defaultValue: 0,
                },
            },
            {
                sequelize,
                modelName: "MomentInteraction",
                tableName: "moment_interactions",
                timestamps: true,
            }
        )
    }

    static associate(models: any) {
        this.belongsTo(models.Moment, { foreignKey: "moment_id", as: "moment" })
    }
} 