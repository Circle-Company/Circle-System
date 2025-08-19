# Utils de Vídeo - Circle System

Este módulo fornece utilitários completos para processamento, conversão, compressão e upload de vídeos, com suporte especial para formatos de iPhone e Android.

## 🎯 Funcionalidades

- ✅ **Conversão de formatos**: MOV, 3GP, AVI, WEBM → MP4
- ✅ **Compressão adaptável**: 5 níveis de qualidade
- ✅ **Upload para AWS S3**: Com otimizações para vídeo
- ✅ **Detecção automática**: Formato e validação de arquivos
- ✅ **Processamento em lote**: Múltiplos vídeos
- ✅ **Presets otimizados**: Redes sociais, streaming, arquivo

## 📱 Formatos Suportados

### Entrada (Conversão automática para MP4)
- **iPhone**: MOV (H.264, HEVC)
- **Android**: MP4, 3GP, WEBM
- **Outros**: AVI, MKV, FLV, WMV

### Saída
- **MP4**: H.264 + AAC (otimizado para web)

## 🚀 Instalação

```bash
# Instalar dependências
npm install fluent-ffmpeg @types/fluent-ffmpeg

# Instalar FFmpeg no sistema
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Baixar de: https://ffmpeg.org/download.html
```

## 📖 Uso Básico

### 1. Processamento Completo (Recomendado)

```typescript
import { processAndUploadVideo } from '@utils/video'

const result = await processAndUploadVideo({
    videoBase64: "data:video/mp4;base64,UklGRnoGAABXQVZFZm10...",
    fileName: "meu_video.mov",
    bucketName: "meu-bucket",
    options: {
        compressionLevel: "medium",
        targetSizeMB: 25
    }
})

console.log("URL do vídeo:", result.uploadResult.url)
console.log("Redução de tamanho:", result.processingStats.compressionRatio + "%")
```

### 2. Apenas Conversão

```typescript
import { convertVideoToMp4 } from '@utils/video'

const mp4Base64 = await convertVideoToMp4({
    videoBase64: iphoneVideoBase64,
    inputFormat: "mov",
    quality: "high"
})
```

### 3. Apenas Compressão

```typescript
import { compressVideo } from '@utils/video'

const result = await compressVideo({
    videoBase64: videoBase64,
    compressionLevel: "adaptive",
    targetSizeMB: 20
})

console.log(`Tamanho reduzido de ${result.originalSizeMB}MB para ${result.compressedSizeMB}MB`)
```

## 🎛️ Níveis de Compressão

### Predefinidos
```typescript
"low"     // Qualidade alta, arquivo maior
"medium"  // Balanceado (padrão)
"high"    // Qualidade boa, arquivo menor
"ultra"   // Máxima compressão
"adaptive" // Automático baseado no tamanho
```

### Configurações Detalhadas
```typescript
// Low: 2000k video, 192k audio, CRF 20
// Medium: 1000k video, 128k audio, CRF 24
// High: 800k video, 96k audio, CRF 26
// Ultra: 400k video, 64k audio, CRF 30
```

## 🎨 Presets por Uso

### Redes Sociais (Instagram, TikTok)
```typescript
import { QUALITY_PRESETS } from '@utils/video'

const result = await processAndUploadVideo({
    videoBase64,
    fileName: "video_social.mp4",
    bucketName: "social-videos",
    options: {
        compressionLevel: QUALITY_PRESETS.social.compressionLevel, // "medium"
        targetSizeMB: QUALITY_PRESETS.social.targetSizeMB,         // 25MB
        maxDurationSeconds: QUALITY_PRESETS.social.maxDurationSeconds // 60s
    }
})
```

### Streaming/Web
```typescript
const result = await processAndUploadVideo({
    videoBase64,
    fileName: "video_stream.mp4",
    bucketName: "streaming-videos",
    options: {
        compressionLevel: QUALITY_PRESETS.streaming.compressionLevel, // "high"
        targetSizeMB: QUALITY_PRESETS.streaming.targetSizeMB,         // 100MB
        maxDurationSeconds: QUALITY_PRESETS.streaming.maxDurationSeconds // 600s
    }
})
```

### Preview/Thumbnail
```typescript
const result = await processAndUploadVideo({
    videoBase64,
    fileName: "video_preview.mp4",
    bucketName: "preview-videos",
    options: {
        compressionLevel: QUALITY_PRESETS.preview.compressionLevel, // "ultra"
        targetSizeMB: QUALITY_PRESETS.preview.targetSizeMB,         // 5MB
        maxDurationSeconds: QUALITY_PRESETS.preview.maxDurationSeconds // 30s
    }
})
```

## 📊 Informações do Vídeo

```typescript
import { getVideoInfo } from '@utils/video'

const info = getVideoInfo(videoBase64)
console.log({
    format: info.format,           // "mov", "mp4", "3gp", etc.
    isValid: info.isValid,         // true/false
    estimatedSizeMB: info.estimatedSizeMB // 45.2
})
```

## 🔧 Opções Avançadas

### Processamento Seletivo
```typescript
const result = await processAndUploadVideo({
    videoBase64,
    fileName: "video.mp4",
    bucketName: "videos",
    options: {
        skipConversion: true,    // Pular conversão de formato
        skipCompression: false,  // Manter compressão
        compressionLevel: "high"
    }
})
```

### Controle de Qualidade
```typescript
const result = await processAndUploadVideo({
    videoBase64,
    fileName: "video_custom.mp4",
    bucketName: "custom-videos",
    options: {
        compressionLevel: "medium",
        targetSizeMB: 30,           // Tamanho alvo
        maxDurationSeconds: 120,    // Duração máxima
        contentType: "video/mp4"    // MIME type customizado
    }
})
```

## 📦 Processamento em Lote

```typescript
import { processBatchVideos } from '@utils/video'

const videos = [
    {
        videoBase64: video1Base64,
        fileName: "video1.mov",
        options: { compressionLevel: "high" }
    },
    {
        videoBase64: video2Base64,
        fileName: "video2.3gp",
        options: { compressionLevel: "medium" }
    }
]

const results = await processBatchVideos(videos, "batch-bucket")
results.forEach((result, index) => {
    console.log(`Vídeo ${index + 1}: ${result.uploadResult.url}`)
})
```

## 🎯 Exemplo de Controller

```typescript
import { processAndUploadVideo, getVideoInfo, QUALITY_PRESETS } from '@utils/video'

export class VideoController {
    async uploadVideo(req: Request, res: Response) {
        try {
            const { videoBase64, fileName, processingType = "social" } = req.body

            // Validação
            if (!videoBase64 || !fileName) {
                return res.status(400).json({
                    error: "videoBase64 e fileName são obrigatórios"
                })
            }

            // Verificar se é vídeo válido
            const videoInfo = getVideoInfo(videoBase64)
            if (!videoInfo.isValid) {
                return res.status(400).json({
                    error: "Arquivo não é um vídeo válido"
                })
            }

            // Selecionar preset
            const preset = QUALITY_PRESETS[processingType] || QUALITY_PRESETS.social

            // Processar
            const result = await processAndUploadVideo({
                videoBase64,
                fileName,
                bucketName: process.env.AWS_S3_BUCKET_NAME!,
                options: {
                    compressionLevel: preset.compressionLevel,
                    targetSizeMB: preset.targetSizeMB,
                    maxDurationSeconds: preset.maxDurationSeconds
                }
            })

            // Resposta
            res.json({
                success: true,
                data: {
                    url: result.uploadResult.url,
                    key: result.uploadResult.key,
                    size: result.uploadResult.size,
                    processing: result.processingStats
                }
            })

        } catch (error: any) {
            res.status(500).json({
                error: "Erro no processamento",
                message: error.message
            })
        }
    }
}
```

## ⚡ Performance

### Tempos Estimados (vídeo de 50MB)
- **Conversão MOV→MP4**: ~30-60s
- **Compressão Medium**: ~20-40s
- **Upload S3**: ~10-30s (depende da conexão)
- **Total**: ~60-130s

### Otimizações
- Processamento sequencial em lote (evita sobrecarga)
- Limpeza automática de arquivos temporários
- Configurações otimizadas por preset
- Compressão adaptativa baseada no tamanho

## 🛠️ Configuração do Ambiente

### Variáveis de Ambiente
```env
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=seu-bucket-videos
```

### Estrutura de Pastas
```
temp/                    # Arquivos temporários (auto-limpeza)
├── input_*.tmp         # Vídeos de entrada
└── output_*.mp4        # Vídeos processados
```

## 🚨 Tratamento de Erros

```typescript
try {
    const result = await processAndUploadVideo({...})
} catch (error) {
    if (error.message.includes("não é um vídeo válido")) {
        // Arquivo inválido
    } else if (error.message.includes("Erro na conversão")) {
        // Problema no FFmpeg
    } else if (error.message.includes("Erro no upload")) {
        // Problema no S3
    }
}
```

## 📋 Checklist de Implementação

- [ ] Instalar FFmpeg no sistema
- [ ] Configurar credenciais AWS
- [ ] Instalar dependências npm
- [ ] Configurar bucket S3
- [ ] Testar com vídeo de exemplo
- [ ] Implementar tratamento de erros
- [ ] Configurar limpeza de arquivos temporários

## 🔍 Debugging

```typescript
// Ativar logs detalhados
process.env.DEBUG = "ffmpeg"

// Verificar informações do vídeo
const info = getVideoInfo(videoBase64)
console.log("Debug info:", info)

// Monitorar progresso
// Os logs aparecem automaticamente no console durante o processamento
```

## 📚 Referências

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Fluent FFmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) 