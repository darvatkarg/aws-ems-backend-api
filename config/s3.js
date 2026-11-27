const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ems-tally-media-spikedace-2026';

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

function buildPublicS3Url(key) {
  const cleanKey = String(key).replace(/^\/+/, '');
  return `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${cleanKey}`;
}

function extractS3KeyFromUrl(urlOrKey) {
  if (!urlOrKey || typeof urlOrKey !== 'string') return null;
  if (!urlOrKey.startsWith('http')) {
    return urlOrKey.replace(/^\/+/, '');
  }
  try {
    const parsed = new URL(urlOrKey);
    const expectedHost = `${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;
    if (parsed.hostname === expectedHost) {
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    }
    return null;
  } catch {
    return null;
  }
}

async function uploadBufferToS3({ buffer, key, contentType }) {
  const cleanKey = String(key).replace(/^\/+/, '');
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    })
  );
  return {
    key: cleanKey,
    url: buildPublicS3Url(cleanKey),
  };
}

async function deleteFromS3(urlOrKey) {
  const key = extractS3KeyFromUrl(urlOrKey);
  if (!key) return false;
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
  );
  return true;
}

module.exports = {
  s3Client,
  S3_BUCKET_NAME,
  AWS_REGION,
  buildPublicS3Url,
  extractS3KeyFromUrl,
  uploadBufferToS3,
  deleteFromS3,
};