import convert from 'heic-convert'

type HeicToJpegProps = {
    base64: string
}

export async function HEICtoJPEG({base64} : HeicToJpegProps): Promise<string> {
    try {
        // Decodificar a string base64 para obter os dados binários do HEIC
        const bufferHEIC = Buffer.from(base64, 'base64');

        // Converter o buffer HEIC para JPEG
        const outputBuffer = await convert({
        buffer: bufferHEIC,
        format: 'JPEG',
        quality: 1 // qualidade de compressão JPEG (entre 0 e 1)
        });

        // Codificar o buffer de saída JPEG para base64
        const base64JPEG = outputBuffer.toString('base64');

        return base64JPEG;
    } catch (error) {
        console.error("Error converting HEIC to JPEG:", error);
        throw new Error('Não foi possível converter a imagem HEIC para JPEG.');
    }
}
