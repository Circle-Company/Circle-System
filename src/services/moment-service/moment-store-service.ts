import { swipeEngineApi } from "../../apis/swipe-engine"
import CONFIG from "../../config"
import { InternalServerError, ValidationError } from "../../errors"
import { Tag } from "../../helpers/tag"
import Moment from "../../models/moments/moment-model"
import Metadata from "../../models/moments/moment_metadata-model.js"
import MomentMidia from "../../models/moments/moment_midia-model.js"
import Statistic from "../../models/moments/moment_statistic-model.js"
import UserStatistic from "../../models/user/statistic-model"
import SecurityToolKit from "../../security-tool/src"
import { image_compressor } from "../../utils/image/compressor"
import { HEICtoJPEG } from "../../utils/image/conversor"
import { upload_image_AWS_S3 } from "../../utils/image/upload"
import { StoreNewMomentsProps } from "./types"

export async function store_new_moment({ user_id, moment }: StoreNewMomentsProps) {
    let midia_base64
    let fullhd_aws_s3_url, nhd_aws_s3_url

    if (moment.metadata.file_type == "image/heic")
        midia_base64 = await HEICtoJPEG({ base64: moment.midia.base64 })
    else midia_base64 = moment.midia.base64

    const compressed_fullhd_base64 = await image_compressor({
        imageBase64: midia_base64,
        quality: 40,
        img_width: moment.metadata.resolution_width,
        img_height: moment.metadata.resolution_height,
        resolution: "FULL_HD",
    })
    const compressed_nhd_base64 = await image_compressor({
        imageBase64: midia_base64,
        quality: 25,
        img_width: moment.metadata.resolution_width,
        img_height: moment.metadata.resolution_height,
        resolution: "NHD",
    })

    fullhd_aws_s3_url = await upload_image_AWS_S3({
        imageBase64: compressed_fullhd_base64,
        bucketName: CONFIG.AWS_MIDIA_BUCKET,
        fileName: "fullhd_" + moment.metadata.file_name,
    })
    nhd_aws_s3_url = await upload_image_AWS_S3({
        imageBase64: compressed_nhd_base64,
        bucketName: CONFIG.AWS_MIDIA_BUCKET,
        fileName: "nhd_" + moment.metadata.file_name,
    })

    const sanitization = new SecurityToolKit().sanitizerMethods.sanitizeSQLInjection(
        moment.description
    )

    if (sanitization.isDangerous) {
        throw new ValidationError({
            message:
                "Characters that are considered malicious have been identified in the description.",
            action: 'Please remove characters like "]})*&',
        })
    }

    const new_moment = await Moment.create({
        user_id: user_id,
        description: sanitization.sanitized,
        visible: true,
        blocked: false,
    })

    await UserStatistic.increment("total_moments_num", { by: 1, where: { user_id } })
    // @ts-ignore
    await MomentMidia.create({
        moment_id: new_moment.id,
        content_type: moment.midia.content_type,
        fullhd_resolution: fullhd_aws_s3_url,
        nhd_resolution: nhd_aws_s3_url,
    })
    // @ts-ignore
    await Statistic.create({ moment_id: new_moment.id })
    // @ts-ignore
    await Metadata.create({
        moment_id: new_moment.id,
        duration: Math.trunc(moment.metadata.duration),
        file_name: moment.metadata.file_name,
        file_size: Math.trunc(moment.metadata.file_size),
        file_type: moment.metadata.file_type,
        resolution_width: Math.trunc(moment.metadata.resolution_width),
        resolution_height: Math.trunc(moment.metadata.resolution_height),
    })
    Tag.AutoAdd({ moment_id: new_moment.id, tags: moment.tags })
    return new_moment
}

export async function store_moment_interaction({
    interaction,
    user_id,
    moment_id,
}: {
    interaction: any
    user_id: bigint
    moment_id: bigint
}) {
    try {
        const moment = await Moment.findOne({
            where: { id: moment_id },
        })

        if (!moment)
            throw new InternalServerError({
                message: "This moment does not exist.",
                action: "Make sure the ID was passed correctly.",
            })
        if (moment.deleted)
            throw new InternalServerError({
                message: "This moment has already been previously deleted",
                action: "Make sure this moment has visible to be interacted.",
            })
        return await swipeEngineApi
            .post("/moments/store/interaction", {
                interaction,
                user_id,
                moment_id,
                moment_owner_id: moment.user_id,
            })
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                console.log(error)
            })
    } catch (err) {
        throw new InternalServerError({
            message: "error when searching for moments in swipe-engine-api",
        })
    }
}
