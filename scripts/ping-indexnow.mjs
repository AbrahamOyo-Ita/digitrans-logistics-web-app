import { canonicalUrlFor } from '../shared/site.js';
import { getAllPublicPrerenderRoutes } from '../shared/seoRoutes.js';

async function main() {
  const key = String(process.env.INDEXNOW_KEY || '').trim();
  if (!key) {
    console.log('INDEXNOW_KEY is not set; skipping IndexNow submission.');
    return;
  }

  const host = new URL(canonicalUrlFor('/')).host;
  const urlList = getAllPublicPrerenderRoutes().map((r) => canonicalUrlFor(r));
  const payload = {
    host,
    key,
    keyLocation: canonicalUrlFor(`/${key}.txt`),
    urlList,
  };

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  console.log(`IndexNow response: ${response.status} ${response.statusText} for ${urlList.length} URLs`);
  if (!response.ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
