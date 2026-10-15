#!/usr/bin/env node
// Backs up marketing/ to S3, or restores it onto a fresh machine.
//
//   node marketing/backup.mjs            # push this folder to S3
//   node marketing/backup.mjs --pull     # restore it from S3
//   node marketing/backup.mjs --dry-run  # show what would move
//
// WHY: the sources here are in git, but the media is not, and some of it cannot
// be made again. A Veo or Flow clip does not come back identical from the same
// prompt, and the voice takes cost money to redo. Before this script, the only
// copy of the films, the clips, the cast stills and the voice takes was one
// laptop.
//
// WHERE: s3://mdg-chat/marketing-backup/, a PRIVATE prefix. The bucket policy
// makes only guide/media/* public (see mdg-demo/scripts/media.mts), so nothing
// here is downloadable without credentials. Storage class STANDARD_IA: this is
// read rarely.
//
// Skipped: .work/ (render scratch, about 3.3 GB, rebuilt by the film scripts),
// graphify-out/ and .verify/. No --delete in either direction: a file missing on
// one side is far more likely a half-finished re-render than a retirement.
//
// Credentials: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from the environment,
// or else S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY from ../mdg-backend/.env.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REMOTE = 's3://mdg-chat/marketing-backup/';
const EXCLUDES = ['.work/*', 'graphify-out/*', '.verify/*', '*.DS_Store', 'node_modules/*'];

function credentials() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION || 'ap-south-1',
    };
  }
  const env = {};
  try {
    for (const line of readFileSync(path.join(HERE, '..', 'mdg-backend', '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {}
  if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    console.error('No AWS credentials: export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY,\n' +
      'or make sure ../mdg-backend/.env carries S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.');
    process.exit(1);
  }
  return {
    AWS_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION: env.S3_REGION || 'ap-south-1',
  };
}

const pull = process.argv.includes('--pull');
const dry = process.argv.includes('--dry-run');
const [from, to] = pull ? [REMOTE, HERE] : [HERE, REMOTE];
const args = ['s3', 'sync', from, to, '--size-only', '--only-show-errors'];
for (const e of EXCLUDES) args.push('--exclude', e);
if (!pull) args.push('--storage-class', 'STANDARD_IA');
if (dry) args.push('--dryrun');

console.log(`${pull ? 'Restoring' : 'Backing up'} marketing/ ${pull ? 'from' : 'to'} ${REMOTE}${dry ? ' (dry run)' : ''}`);
const child = spawn('aws', args, { stdio: 'inherit', env: { ...process.env, ...credentials() } });
child.on('exit', (code) => process.exit(code ?? 1));
