import { Request, Response } from "express"
import MetadataModel from "../../models/user/metadata-model.js"

export async function store_user_metadata(req: Request, res: Response) {
    const {
        device_type,
        device_name,
        device_id,
        device_token,
        os_version,
        screen_resolution_width,
        screen_resolution_height,
        os_language,
        total_device_memory,
        has_notch,
    } = req.body

    try {
        const metadataExists = await MetadataModel.findOne({ where: { user_id: req.user_id } })
        if (metadataExists) {
            await MetadataModel.update(
                {
                    device_type,
                    device_name,
                    device_id,
                    device_token,
                    os_version,
                    screen_resolution_width,
                    screen_resolution_height,
                    os_language,
                    total_device_memory,
                    has_notch,
                },
                { where: { user_id: req.user_id } }
            )
            return res.status(200).json({ message: "User metadata has been updated with success" })
        } else {
            await MetadataModel.create({
                user_id: req.user_id,
                device_type,
                device_name,
                device_id,
                device_token,
                os_version,
                screen_resolution_width,
                screen_resolution_height,
                os_language,
                total_device_memory,
                has_notch,
            })
            return res.status(200).json({ message: "User metadata has been created with success" })
        }
    } catch (err: any) {
        console.log(err)
    }
}
