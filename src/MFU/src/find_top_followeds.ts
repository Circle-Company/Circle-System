import Statistic from "../../models/user/statistic-model"

type FindTopFollowedsProps = {
    page: number
    pageSize: number
}

export async function FindTopFolloweds({ page, pageSize }: FindTopFollowedsProps) {
    const offset = (page - 1) * pageSize

    const { count, rows: topUsers } = await Statistic.findAndCountAll({
        attributes: ["total_followers_num", "user_id"],
        order: [["total_followers_num", "DESC"]],
        limit: pageSize,
        offset,
    })

    const totalPages = Math.ceil(count / pageSize)

    return {
        topUsers,
        totalPages,
        currentPage: page,
        pageSize,
    }
}
