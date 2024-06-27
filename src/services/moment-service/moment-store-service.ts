import { StoreNewMomentsProps } from "./types"
import { InternalServerError } from "../../errors"
import { Tag } from "../../helpers/tag"
import Statistic from '../../models/moments/moment_statistic-model.js'
import Metadata from '../../models/moments/moment_metadata-model.js'
import MomentMidia from '../../models/moments/moment_midia-model.js'
import UserStatistic from '../../models/user/statistic-model.js'
import Moment from '../../models/moments/moment-model.js'
import { upload_image_AWS_S3 } from "../../utils/image/upload"
import CONFIG from "../../config"
import { image_compressor } from "../../utils/image/compressor"
import { swipe_engine_api } from "../../apis/swipe-engine"
import { HEICtoJPEG } from '../../utils/image/conversor'


export async function store_new_moment({    
    user_id,
    moment
}: StoreNewMomentsProps) {
    try {
        let midia_base64
        let fullhd_aws_s3_url, nhd_aws_s3_url

        if(moment.metadata.file_type == 'image/heic') midia_base64 = await HEICtoJPEG({base64: moment.midia.base64})
        else midia_base64 = moment.midia.base64

        const compressed_fullhd_base64 = await image_compressor({
            imageBase64: midia_base64,
            quality: 40,
            img_width: moment.metadata.resolution_width,
            img_height: moment.metadata.resolution_height,
            resolution: 'FULL_HD'
        })
        const compressed_nhd_base64 = await image_compressor({
            imageBase64: midia_base64,
            quality: 30,
            img_width: moment.metadata.resolution_width,
            img_height: moment.metadata.resolution_height,
            resolution: 'NHD'
        })

        fullhd_aws_s3_url = await upload_image_AWS_S3({
            imageBase64: compressed_fullhd_base64,
            bucketName: CONFIG.AWS_MIDIA_BUCKET,
            fileName: 'fullhd_' + moment.metadata.file_name
        })
        nhd_aws_s3_url = await upload_image_AWS_S3({
            imageBase64: compressed_nhd_base64,
            bucketName: CONFIG.AWS_MIDIA_BUCKET,
            fileName: 'nhd_' + moment.metadata.file_name
        })
        
        const new_moment = await Moment.create({
            user_id: user_id,
            description: moment.description,
            visible: true,
            blocked: false
        })

        await UserStatistic.increment('total_moments_num',{ by: 1, where: { user_id }})

        await MomentMidia.create({
            moment_id: new_moment.id,
            content_type: moment.midia.content_type,
            fullhd_resolution: fullhd_aws_s3_url,
            nhd_resolution: nhd_aws_s3_url
        })
        await Statistic.create({ moment_id: new_moment.id })
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
    } catch (err: any) {
        throw new InternalServerError({ message: err.message })
    }
}

export async function store_moment_interaction({interaction, user_id, moment_id, moment_owner_id}) {
    try{
        return await swipe_engine_api.post('/moments/store/interaction', { interaction, user_id, moment_id, moment_owner_id })
        .then(function (response) { return response.data })
        .catch(function (error) { console.log(error)})
    } catch(err) {
        throw new InternalServerError({
            message: 'error when searching for moments in swipe-engine-api'
        })
    } 
}
