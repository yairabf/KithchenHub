
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'household-uploads';
const REGION = process.env.S3_REGION || 'us-east-1';
const ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';

console.log('🔧 Initializing MinIO Setup...');
console.log(`   Endpoint: ${ENDPOINT}`);
console.log(`   Bucket:   ${BUCKET_NAME}`);

const s3 = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
});

async function run() {
    try {
        console.log(`🔍 Checking if bucket '${BUCKET_NAME}' exists...`);
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`✅ Bucket '${BUCKET_NAME}' already exists.`);
    } catch (err: any) {
        if (err && (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404)) {
            console.log(`⚠️ Bucket '${BUCKET_NAME}' not found. Creating...`);
            try {
                await s3.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
                console.log(`✅ Bucket '${BUCKET_NAME}' created successfully!`);
            } catch (createErr) {
                console.error('❌ Failed to create bucket:', createErr);
                process.exit(1);
            }
        } else {
            console.error('❌ Error checking bucket:', err);
            process.exit(1);
        }
    }
}

run();
