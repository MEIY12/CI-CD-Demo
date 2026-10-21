#!/usr/bin/env node
/**
 * README setup for Contentful space y5e4ruaamic2 (CI/CD demo).
 * Reads CMA token from CONTENTFUL_MANAGEMENT_ACCESS_TOKEN or ~/.contentfulrc.json.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const SPACE_ID = 'y5e4ruaamic2';
const TARGET_ENV = 'main';

function loadManagementToken() {
  if (process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN) {
    return process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN;
  }
  const rcPath = join(homedir(), '.contentfulrc.json');
  if (!existsSync(rcPath)) {
    throw new Error(
      'No CMA token. Run `contentful login` or set CONTENTFUL_MANAGEMENT_ACCESS_TOKEN.'
    );
  }
  const rc = JSON.parse(readFileSync(rcPath, 'utf8'));
  if (!rc.managementToken) {
    throw new Error(
      'No managementToken in ~/.contentfulrc.json. Run `contentful login`.'
    );
  }
  return rc.managementToken;
}

function cmaRequest(token, method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: 'api.contentful.com',
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          ...extraHeaders,
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            reject(
              new Error(
                `CMA ${method} ${path} → ${res.statusCode}: ${JSON.stringify(parsed).slice(0, 300)}`
              )
            );
          } else {
            resolve(parsed);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function ensureEnvironment(token, envId) {
  try {
    await cmaRequest(
      token,
      'GET',
      `/spaces/${SPACE_ID}/environments/${envId}`
    );
    console.log(`✓ Environment "${envId}" exists`);
  } catch (e) {
    if (!String(e.message).includes('404')) throw e;
    console.log(`→ Creating environment "${envId}" from master…`);
    await cmaRequest(token, 'PUT', `/spaces/${SPACE_ID}/environments/${envId}`, {
      name: envId,
    });
    console.log(`✓ Environment "${envId}" created`);
  }
}

async function ensureAlias(token, aliasId, targetEnvId) {
  let current;
  try {
    current = await cmaRequest(
      token,
      'GET',
      `/spaces/${SPACE_ID}/environment_aliases/${aliasId}`
    );
  } catch (e) {
    if (!String(e.message).includes('404')) throw e;
    current = null;
  }
  const target = current?.environment?.sys?.id;
  if (target === targetEnvId) {
    console.log(`✓ Alias "${aliasId}" → "${targetEnvId}"`);
    return;
  }
  console.log(`→ Updating alias "${aliasId}" → "${targetEnvId}"…`);
  await cmaRequest(
    token,
    'PUT',
    `/spaces/${SPACE_ID}/environment_aliases/${aliasId}`,
    {
      environment: {
        sys: { type: 'Link', linkType: 'Environment', id: targetEnvId },
      },
    }
  );
  console.log(`✓ Alias "${aliasId}" → "${targetEnvId}"`);
}

async function hasArticleContentType(token) {
  try {
    await cmaRequest(
      token,
      'GET',
      `/spaces/${SPACE_ID}/environments/${TARGET_ENV}/content_types/article`
    );
    return true;
  } catch (e) {
    if (String(e.message).includes('404')) return false;
    throw e;
  }
}

function runContentModelMigration(token) {
  console.log('→ Running setup/content-model.js migration on main…');
  const result = spawnSync(
    'npx',
    [
      'contentful',
      'space',
      'migration',
      '-s',
      SPACE_ID,
      '-e',
      TARGET_ENV,
      '-y',
      'setup/content-model.js',
      `--mt=${token}`,
    ],
    { cwd: projectRoot, stdio: 'inherit', env: process.env }
  );
  if (result.status !== 0) {
    throw new Error('Content model migration failed');
  }
  console.log('✓ Content model migration complete');
}

async function ensureEnvLocal(token) {
  const envPath = join(projectRoot, '.env.local');
  const needsKeys =
    !existsSync(envPath) ||
    !readFileSync(envPath, 'utf8').includes('CONTENTFUL_CDA=');

  if (!needsKeys) {
    console.log('✓ .env.local already configured');
    return;
  }

  console.log('→ Creating delivery API key for local Next.js…');
  const key = await cmaRequest(token, 'POST', `/spaces/${SPACE_ID}/api_keys`, {
    name: 'CI/CD Demo Local',
    environments: [
      { sys: { type: 'Link', linkType: 'Environment', id: TARGET_ENV } },
    ],
  });
  const lines = [
    `CONTENTFUL_SPACE_ID=${SPACE_ID}`,
    `CONTENTFUL_ENVIRONMENT=${TARGET_ENV}`,
    `CONTENTFUL_CDA=${key.accessToken}`,
    `CONTENTFUL_CPA=${key.accessToken}`,
    '',
  ];
  writeFileSync(envPath, lines.join('\n'));
  console.log('✓ Wrote .env.local');
}

async function seedSampleArticle(token) {
  const collection = await cmaRequest(
    token,
    'GET',
    `/spaces/${SPACE_ID}/environments/${TARGET_ENV}/entries?content_type=article&limit=1`
  );
  if (collection.total > 0) {
    console.log(`✓ Sample content: ${collection.total} article(s) already present`);
    return;
  }

  console.log('→ Publishing sample article entry…');
  const entry = await cmaRequest(
    token,
    'POST',
    `/spaces/${SPACE_ID}/environments/${TARGET_ENV}/entries`,
    {
      fields: {
        title: { 'en-US': 'Welcome to the CI/CD demo' },
        slug: { 'en-US': 'welcome' },
        body: {
          'en-US': {
            nodeType: 'document',
            data: {},
            content: [
              {
                nodeType: 'paragraph',
                data: {},
                content: [
                  {
                    nodeType: 'text',
                    value:
                      'This article was created during project setup. Edit it in Contentful or add migrations via pull request.',
                    marks: [],
                    data: {},
                  },
                ],
              },
            ],
          },
        },
      },
    },
    { 'X-Contentful-Content-Type': 'article' }
  );

  const entryId = entry.sys.id;
  await cmaRequest(
    token,
    'PUT',
    `/spaces/${SPACE_ID}/environments/${TARGET_ENV}/entries/${entryId}/published`,
    null,
    { 'X-Contentful-Version': String(entry.sys.version) }
  );
  console.log(`✓ Published sample article (slug: welcome)`);
}

function writeProjectContentfulRc() {
  const path = join(projectRoot, '.contentfulrc.json');
  writeFileSync(
    path,
    JSON.stringify(
      { activeSpaceId: SPACE_ID, activeEnvironmentId: TARGET_ENV },
      null,
      2
    ) + '\n'
  );
  console.log('✓ Updated project .contentfulrc.json');
}

async function main() {
  const token = loadManagementToken();
  console.log(`\nContentful setup — space ${SPACE_ID}\n`);

  await ensureEnvironment(token, TARGET_ENV);
  await ensureAlias(token, 'master', TARGET_ENV);
  await ensureAlias(token, 'development', TARGET_ENV);

  if (!(await hasArticleContentType(token))) {
    runContentModelMigration(token);
  } else {
    console.log('✓ Content type "article" already on main');
  }

  await ensureEnvLocal(token);
  await seedSampleArticle(token);
  writeProjectContentfulRc();

  console.log('\nContentful setup finished.\n');
  console.log('GitHub Actions secrets (repo settings):');
  console.log('  CF_SPACE_ID =', SPACE_ID);
  console.log('  CF_CMA_KEY  = your Contentful Management API token\n');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
