import { InternalServerError } from "../errors"
import Metadata from "../models/moments/moment_metadata-model.js"
import Moment from "../models/moments/moment-model"
import MomentMidia from "../models/moments/moment_midia-model.js"
import MomentTag from "../models/moments/moment_tag-model.js"
import Statistic from "../models/moments/moment_statistic-model.js"
import Tag from "../models/tags/tag-model"

type PopulateMomentsProps = {
    moment_id: bigint
    stats?: boolean
    metadata?: boolean
    midia?: boolean
    statistic?: boolean
    comments?: boolean
    tags?: boolean
}

interface MomentType extends Omit<Moment, 'createdAt'> {
    createdAt: Date;
}

export async function populateMoment({
    moment_id,
    stats = true,
    metadata = false,
    midia = true,
    statistic = false,
    tags = false,
}: PopulateMomentsProps) {
    const momentData: any = {}

    const moment = (await Moment.findOne({
        where: { id: moment_id },
        attributes: ["id", "description", "createdAt"],
    })) as MomentType

    if (!moment) throw new InternalServerError({ message: "Can't possible find moment." })
    momentData.id = moment.id
    momentData.description = moment.description
    momentData.created_at = moment.createdAt instanceof Date ? moment.createdAt.toISOString() : moment.createdAt

    if (stats) {
        const momentStats = await Moment.findOne({
            where: { id: moment_id },
            attributes: ["visible", "deleted", "blocked"],
        })

        if (!momentStats)
            throw new InternalServerError({ message: "Can't possible find moment stats." })
        momentData.visible = momentStats.visible
        momentData.deleted = momentStats.deleted
        momentData.blocked = momentStats.blocked
    }
    if (metadata) {
        // @ts-ignore
        const metadata = await Metadata.findOne({
            where: { moment_id },
            attributes: { exclude: ["createdAt", "updatedAt", "id", "moment_id"] },
        })
        momentData.metadata = metadata
    }

    if (midia) {
        // @ts-ignore
        const midia = await MomentMidia.findOne({
            where: { moment_id },
            attributes: ["content_type", "nhd_resolution", "fullhd_resolution"],
        })
        momentData.midia = midia
    }

    if (statistic) {
        // @ts-ignore
        const statistic = await Statistic.findOne({
            where: { moment_id },
            attributes: ["total_likes_num"],
        })
        momentData.statistics = statistic
    }

    if (tags) {
        // @ts-ignore
        const tags = await MomentTag.findAll({
            where: { moment_id },
            include: [{ model: Tag, as: "tag", attributes: ["title", "id"] }],
            attributes: [],
        })

        const tags_titles = tags.map((momentTag: any) => {
            return {
                id: momentTag.tag.id,
                title: momentTag.tag.title,
            }
        })
        momentData.tags = tags_titles
    }

    return momentData
}
