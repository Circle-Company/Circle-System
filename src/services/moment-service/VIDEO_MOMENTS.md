# Momentos de Vídeo - Circle System

## 🎬 Funcionalidade

A função `store_new_moment_video` permite criar momentos com conteúdo de vídeo, incluindo:

- ✅ **Processamento automático**: Conversão, compressão e otimização
- ✅ **Múltiplas resoluções**: Full HD e NHD para diferentes dispositivos
- ✅ **Thumbnails automáticos**: Geração de miniaturas em duas resoluções
- ✅ **Embeddings**: Geração automática para sistema de recomendação
- ✅ **Suporte a formatos**: iPhone (MOV), Android (3GP, MP4), etc.

## 📱 Formatos Suportados

### Entrada
- **iPhone**: MOV, MP4
- **Android**: 3GP, MP4, WEBM
- **Outros**: AVI, MKV, FLV, WMV

### Saída
- **Vídeo**: MP4 (H.264 + AAC)
- **Thumbnails**: JPEG comprimido

## 🚀 Como Usar

```typescript
import { store_new_moment_video } from '@services/moment-service/moment-store-service'

const videoMoment = {
    id: BigInt(Date.now()),
    description: "Meu vídeo incrível!",
    midia: {
        content_type: "VIDEO",
        base64: "data:video/mp4;base64,UklGRnoGAAB..." // Base64 do vídeo
    },
    metadata: {
        duration: 45, // segundos
        file_name: "video.mov",
        file_size: 30000000, // bytes
        file_type: "video/mov",
        resolution_width: 1920,
        resolution_height: 1080
    },
    tags: [
        { title: "viagem" },
        { title: "natureza" }
    ],
    statistic: {
        is_trend: false,
        total_likes_num: 0,
        total_views_num: 0,
        total_shares_num: 0,
        total_reports_num: 0,
        total_skips_num: 0,
        total_comments_num: 0,
        total_profile_clicks_num: 0
    }
}

const result = await store_new_moment_video({
    user_id: BigInt(123),
    moment: videoMoment
})
```

## 🔧 Processamento Automático

### 1. Vídeo Principal (Full HD)
- **Compressão**: Medium (1000k video, 128k audio)
- **Tamanho máximo**: 50MB
- **Duração máxima**: 5 minutos
- **Formato**: MP4 (H.264 + AAC)

### 2. Vídeo Comprimido (NHD)
- **Compressão**: High (800k video, 96k audio)
- **Tamanho máximo**: 15MB
- **Duração máxima**: 5 minutos
- **Formato**: MP4 (H.264 + AAC)

### 3. Thumbnails
- **Full HD**: 1920x1080, qualidade 80%
- **NHD**: 640x360, qualidade 70%
- **Momento**: 1 segundo do vídeo
- **Formato**: JPEG comprimido

## 📊 Banco de Dados

### Tabela: `moments`
```sql
- id: bigint (PK)
- user_id: bigint (FK)
- description: text (sanitizado)
- visible: boolean
- blocked: boolean
```

### Tabela: `moment_midia`
```sql
- moment_id: bigint (FK)
- content_type: "VIDEO"
- fullhd_resolution: string (URL S3 do vídeo Full HD)
- nhd_resolution: string (URL S3 do vídeo NHD)
- fullhd_thumbnail: string (URL S3 do thumbnail Full HD)
- nhd_thumbnail: string (URL S3 do thumbnail NHD)
```

### Tabela: `moment_metadata`
```sql
- moment_id: bigint (FK)
- duration: int (segundos)
- file_name: string
- file_size: int (MB do vídeo processado)
- file_type: "video/mp4"
- resolution_width: int
- resolution_height: int
```

## 🤖 Sistema de Recomendação

### Embeddings
- **Texto**: Descrição do momento
- **Tags**: Tags associadas
- **Métricas**: Inicializadas em zero
- **Autor**: ID do usuário
- **Timestamp**: Data de criação

### Clustering
- Atribuição automática a clusters
- Processamento via `processNewPost()`
- Integração com swipe-engine

## ⚡ Performance

### Tempos Estimados (vídeo de 30MB)
- **Processamento Full HD**: ~40-60s
- **Processamento NHD**: ~30-45s
- **Geração de thumbnails**: ~5-10s
- **Upload S3**: ~15-30s
- **Total**: ~90-145s

### Otimizações
- Processamento paralelo de resoluções
- Compressão adaptativa
- Limpeza automática de arquivos temporários
- Cache de thumbnails

## 🛡️ Segurança

### Validações
- Sanitização de descrição (SQL Injection)
- Validação de formato de vídeo
- Limite de tamanho e duração
- Verificação de permissões

### Tratamento de Erros
- Logs detalhados
- Limpeza de recursos
- Fallback gracioso
- Mensagens de erro específicas

## 📝 Logs

```
INFO: Gerando embedding para novo momento de vídeo 123
INFO: Processando momento de vídeo 123 para atribuição a clusters
INFO: Momento de vídeo 123 processado e atribuído a clusters
INFO: Momento de vídeo 123 criado com sucesso
INFO: Vídeo processado: 65.2% de compressão
```

## 🚨 Possíveis Erros

### Formato Inválido
```
Erro: Arquivo fornecido não é um vídeo válido
Solução: Verificar formato e integridade do arquivo
```

### Tamanho Excessivo
```
Erro: Vídeo excede limite de tamanho
Solução: Comprimir vídeo antes do upload
```

### Duração Excessiva
```
Erro: Vídeo excede duração máxima
Solução: Cortar vídeo para máximo 5 minutos
```

### Erro de Upload
```
Erro: Falha no upload para S3
Solução: Verificar credenciais AWS e conectividade
```

## 🔍 Debugging

### Verificar Vídeo
```typescript
import { getVideoInfo } from '@utils/video'

const info = getVideoInfo(videoBase64)
console.log({
    format: info.format,
    isValid: info.isValid,
    estimatedSizeMB: info.estimatedSizeMB
})
```

### Logs Detalhados
```typescript
// Ativar logs do FFmpeg
process.env.DEBUG = "ffmpeg"

// Monitorar progresso
// Os logs aparecem automaticamente durante o processamento
```

## 📋 Checklist de Implementação

- [x] Função `store_new_moment_video` criada
- [x] Processamento de vídeo implementado
- [x] Geração de thumbnails implementada
- [x] Upload para S3 configurado
- [x] Embeddings integrados
- [x] Sistema de clustering integrado
- [x] Tratamento de erros implementado
- [x] Logs detalhados adicionados
- [x] Documentação criada

## 🔗 Arquivos Relacionados

- `src/services/moment-service/moment-store-service.ts` - Função principal
- `src/utils/video/` - Utilitários de vídeo
- `src/utils/video/thumbnail.ts` - Geração de thumbnails
- `src/services/moment-service/types.ts` - Tipos TypeScript
- `src/utils/video/examples.ts` - Exemplos de uso 