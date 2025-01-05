import crypto from "crypto"
import { AWS_S3 } from "../../config/AWS_S3"
import { ServiceError } from "../../errors"

type UploadImageAWSS3Props = {
    imageBase64: string
    bucketName: string
    fileName: string
}

const generateHashKey = (fileName: string) => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, hash) => {
            if (err) {
                reject(new ServiceError({ message: err.message }))
            } else {
                const hashKey = `${hash.toString("hex")}-${fileName}`
                resolve(hashKey)
            }
        })
    })
}

export async function upload_image_AWS_S3({
    imageBase64,
    bucketName,
    fileName,
}: UploadImageAWSS3Props) {
    try {
        // Decodificar a imagem base64 para um buffer
        const compressedImageBuffer = Buffer.from(imageBase64, "base64")

        const hashKey = await generateHashKey(fileName)
            .then((hashKey) => {
                return `${hashKey}`
            })
            .catch((err) => {
                throw new ServiceError({ message: err.message })
            })

        // Parâmetros para enviar a imagem para o S3
        const params = {
            Bucket: bucketName,
            Key: hashKey,
            Body: compressedImageBuffer,
            ContentType: "image/jpeg", // Tipo de conteúdo da imagem
            ACL: "public-read", // Permissão de acesso à imagem
        }

        // Enviar a imagem para o S3
        const uploadResult = await AWS_S3.upload(params).promise()
        return uploadResult.Location
    } catch (error) {
        console.error("Erro ao enviar imagem para o S3:", error)
        throw error
    }
}
