import { config } from 'dotenv'
import path from 'path'
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3'

config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '../../.env') })

const bucket = process.env.S3_BUCKET?.trim()
const accessKeyId = process.env.S3_ACCESS_KEY?.trim()
const secretAccessKey = process.env.S3_SECRET_KEY?.trim()
const endpoint = process.env.S3_ENDPOINT?.trim()

const missing: string[] = []
if (!bucket) missing.push('S3_BUCKET')
if (!accessKeyId) missing.push('S3_ACCESS_KEY')
if (!secretAccessKey) missing.push('S3_SECRET_KEY')
if (!endpoint) missing.push('S3_ENDPOINT')

if (missing.length > 0) {
  console.error('❌  Missing required env variables:', missing.join(', '))
  process.exit(1)
}

const rawOrigins = process.env.CORS_ORIGINS || process.env.NEXT_PUBLIC_SITE_URL || '*'
const allowedOrigins = rawOrigins === '*' ? ['*'] : rawOrigins.split(',').map((o) => o.trim())

const s3 = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
})

async function main() {
  console.log('─────────────────────────────────────────')
  console.log('  R2 CORS Setup via AWS S3 Client SDK    ')
  console.log('─────────────────────────────────────────')
  console.log(`🪣  Bucket  : ${bucket}`)
  console.log(`🌍  Origins : ${allowedOrigins.join(', ')}`)
  console.log()

  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['PUT', 'GET', 'HEAD', 'POST', 'DELETE'],
              AllowedOrigins: allowedOrigins,
              ExposeHeaders: ['ETag', 'Content-Type', 'Content-Length'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    )
    console.log('✅  CORS rules applied successfully.\n')

    const result = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }))
    console.log('📋  Verified CORS rules on R2:')
    console.log(JSON.stringify(result.CORSRules, null, 2))
    console.log()
    console.log('Done. You can now upload directly from the browser to R2.')
  } catch (error: any) {
    console.error('\n❌  Failed:', error.message)
    process.exit(1)
  }
}

main()
