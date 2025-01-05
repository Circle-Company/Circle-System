import { DataTypes, Model, Optional, Sequelize } from "sequelize"

// Defina a interface para os atributos da Coordinate
interface CoordinateAttributes {
    id?: number
    latitude?: number | null
    longitude?: number | null
    user_id: bigint
}

interface CoordinateCreationAttributes extends Optional<CoordinateAttributes, "id"> {}

class Coordinate
    extends Model<CoordinateAttributes, CoordinateCreationAttributes>
    implements CoordinateAttributes
{
    public readonly id!: number
    public latitude!: number | null
    public longitude!: number | null
    public user_id!: bigint

    // Relacionamento
    static associate(models: any) {
        this.belongsTo(models.User, { foreignKey: "user_id", as: "user" })
    }

    // Inicialização do modelo
    static initialize(sequelize: Sequelize) {
        super.init(
            {
                latitude: DataTypes.DECIMAL(20, 15),
                longitude: DataTypes.DECIMAL(20, 15),
                user_id: {
                    type: DataTypes.BIGINT,
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: "coordinates",
                modelName: "Coordinate", // Adicione o nome do modelo para facilitar a referência
                timestamps: true,
            }
        )
    }
}

export default Coordinate
