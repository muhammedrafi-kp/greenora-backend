import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { configDotenv } from 'dotenv';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { s3 } from "../config/s3Config";

export const getSignedProfileImageUrl = async (key: string): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 }); // 1 hour expiry
    return signedUrl;
};