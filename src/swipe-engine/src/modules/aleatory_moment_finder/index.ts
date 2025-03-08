import Moment from "@models/moments/moment-model"
import { Op } from "sequelize"

type AleatoryMomentFinderProps = {
    quantity: number
    interacted_moments_list: Array<number>
}
export async function AleatoryMomentFinder({
    quantity,
    interacted_moments_list,
}: AleatoryMomentFinderProps): Promise<number[]> {
    const momentsList = (await Moment.findAll({
        where: {
            id: { [Op.notIn]: interacted_moments_list },
            deleted: false,
            blocked: false,
            visible: true,
        },
        attributes: ["id", "created_at"],
        order: [["created_at", "DESC"]],
        limit: quantity,
    })) as any

    return momentsList.map((moment) => {
        return moment.id
    })
}
