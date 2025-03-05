import Moment from "@/models/moments/moment-model"

type SecurityLayerProps = {
    momentsIdsList: bigint[]
    options: {
        allowBlocked?: boolean
        allowDeleted?: boolean
        allowInvisible?: boolean
    }
}

export default async function SecurityLayer({
    momentsIdsList,
    options: { allowBlocked = false, allowDeleted = false, allowInvisible = true },
}: SecurityLayerProps): Promise<any[] | null> {
    const populated_moments = await Promise.all(
        momentsIdsList.map(async (moment_id) => {
            const moment = await Moment.findOne({
                where: { id: moment_id },
                attributes: ["id", "visible", "deleted", "blocked"],
            })

            if (moment)
                return {
                    id: moment.id,
                    visible: moment.visible,
                    deleted: moment.deleted,
                    blocked: moment.blocked,
                }
            else return null
        })
    )

    // Filtrar os momentos de acordo com as opções
    const filteredMoments = populated_moments.filter((moment) => {
        if (!allowInvisible && !moment?.visible) return false
        if (!allowDeleted && moment?.deleted) return false
        if (!allowBlocked && moment?.blocked) return false
        else return true
    })

    const cleanedMoments = filteredMoments.map((moment) => {
        return { id: moment?.id }
    })

    return filteredMoments.length > 0 ? filteredMoments : null
}
