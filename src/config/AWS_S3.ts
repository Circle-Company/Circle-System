import AWS from 'aws-sdk'
import CONFIG from "."

// Configurar as credenciais da AWS
AWS.config.update({
  accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
  secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  region: CONFIG.AWS_REGION
});

// Criar uma nova instância do serviço S3
export const AWS_S3 = new AWS.S3()