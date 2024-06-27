import Statistic from '../models/moments/moment_statistic-model.js'
import Metadata from '../models/moments/moment_metadata-model.js'
import MomentMidia from '../models/moments/moment_midia-model.js'
import Comment from '../models/comments/comment-model.js'
import CommentStatistic from '../models/comments/comment_statistics-model.js'
import Moment from '../models/moments/moment-model.js'
import MomentTag from '../models/moments/moment_tag-model.js'
import Tag from '../models/tags/tag-model.js'

type PopulateMomentsProps = {
    moment_id: number,
    stats?: boolean,
    metadata?: boolean,
    midia?: boolean,
    statistic?: boolean,
    comments?: boolean,
    tags?: boolean,
}

export async function populateMoment({
    moment_id,
    stats = true,
    metadata = false,
    midia = true,
    statistic = false,
    tags = false,
}: PopulateMomentsProps) {
    const momentData: any = {};

    const moment = await Moment.findOne({ where: { id: moment_id }, attributes: ["id", "description", 'createdAt'] });
    momentData.id = moment.id;
    momentData.description = moment.description;
    momentData.created_at = moment.createdAt;

    if(stats) {
        const momentStats = await Moment.findOne({
            where: { id: moment_id },
            attributes: ['visible', 'deleted', 'blocked']
        })
        momentData.visible = momentStats.visible
        momentData.deleted = momentStats.deleted
        momentData.blocked = momentStats.blocked

    }if (metadata) {
        const metadata = await Metadata.findOne({
            where: { moment_id },
            attributes: { exclude: ['createdAt', 'updatedAt', 'id', 'moment_id']}
        });
        momentData.metadata = metadata;
    }

    if (midia) {
        const midia = await MomentMidia.findOne({
            where: { moment_id },
            attributes: ['content_type', 'nhd_resolution', 'fullhd_resolution']
        });
        momentData.midia = midia;
    }

    if (statistic) {
        const statistic = await Statistic.findOne({ where: { moment_id }, attributes: ['total_likes_num'] })
        momentData.statistics = statistic;
    }

    if (tags) {
        const tags = await MomentTag.findAll({
            where: { moment_id },
            include: [{ model: Tag, as: 'tag', attributes: ['title', 'id'] }],
            attributes: []
        });

        const tags_titles = tags.map(momentTag => {
            return {
                id: momentTag.tag.id,
                title: momentTag.tag.title
            };
        });
        momentData.tags = tags_titles;
    }

    return momentData;
}