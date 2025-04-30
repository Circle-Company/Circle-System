//@ts-nocheck
import { QueryTypes } from "sequelize"
import { connection as db } from "../../../../database/index.js"

export default async function cold_start_algorithm(): Promise<number[]> {
    const moments = (await db.query(
        `SELECT m.id
             FROM moments m
             INNER JOIN users u ON u.id = m.user_id
             WHERE m.deleted_at IS NULL
                AND u.deleted_at IS NULL
                AND m.visible = true
                AND m.blocked = false
                AND u.blocked = false
             ORDER BY m.created_at DESC
             LIMIT 100`,
        {
            type: QueryTypes.SELECT,
        }
    )) as { id: number }[]

    console.log(moments)
    return moments.map((moment) => moment.id)
}
