// Tiny S3 helper for the standby package, using the S3 client and keys the
// backend already has (no AWS CLI, no new credentials).
//   node s3.cjs put  <file> <key>
//   node s3.cjs get  <key>  <file>
//   node s3.cjs keep <prefix> <n>     delete all but the newest n under prefix
const fs = require('fs');
const path = require('path');
const HOME = '/home/ubuntu';
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } =
  require(path.join(HOME, 'mdg-backend/node_modules/@aws-sdk/client-s3'));

const env = Object.fromEntries(
  fs.readFileSync(path.join(HOME, 'mdg-backend/.env'), 'utf8').split('\n')
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]));
const Bucket = env.S3_BUCKET;
const s3 = new S3Client({
  region: env.S3_REGION,
  credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
});

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'put') {
    await s3.send(new PutObjectCommand({ Bucket, Key: b, Body: fs.readFileSync(a), ServerSideEncryption: 'AES256' }));
    console.log(`uploaded s3://${Bucket}/${b} (${fs.statSync(a).size} bytes)`);
  } else if (cmd === 'get') {
    const r = await s3.send(new GetObjectCommand({ Bucket, Key: a }));
    await fs.promises.writeFile(b, Buffer.from(await r.Body.transformToByteArray()));
    console.log(`downloaded s3://${Bucket}/${a} (${fs.statSync(b).size} bytes)`);
  } else if (cmd === 'keep') {
    const r = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: a }));
    const old = (r.Contents || []).sort((x, y) => y.LastModified - x.LastModified).slice(Number(b));
    if (old.length) await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: old.map((o) => ({ Key: o.Key })) } }));
    console.log(`kept ${Math.min(Number(b), (r.Contents || []).length)}, removed ${old.length}`);
  } else {
    throw new Error('usage: put|get|keep');
  }
}
main().catch((e) => { console.error(`s3 ${process.argv[2]} failed: ${e.name}: ${e.message}`); process.exit(1); });
