import { Request, Response } from "express"
import path from "path"

export async function reportAccount(req: Request, res: Response) {
    const page = path.join(__dirname, "../../../public/pages/report/index.html")
    res.status(200).sendFile(page)
}
