import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: 'us-west-1', // Mumbai region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
