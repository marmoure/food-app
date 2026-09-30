import { readdir, readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const library = path.resolve(process.argv[2] || '/home/z/Documents/projects/frozen-goods/library');
const media = JSON.parse(await readFile(path.join(library, 'media.json'), 'utf8'));
const recipes = [];
const clean = (text) => text.replace(/<!--[^]*?-->/g, '').trim();
await mkdir(path.join(root, 'public/library/images'), { recursive: true });
for (const folder of await readdir(library, { withFileTypes: true })) {
  if (!folder.isDirectory() || folder.name === 'images') continue;
  for (const file of (await readdir(path.join(library, folder.name))).sort()) {
    if (!file.endsWith('.md') || file.startsWith('README') || file.startsWith('_')) continue;
    const source = `${folder.name}/${file}`;
    const markdown = await readFile(path.join(library, source), 'utf8');
    const match = markdown.match(/^---\n([^]*?)\n---\n([^]*)$/);
    if (!match) throw new Error(`Missing metadata: ${source}`);
    const meta = Object.fromEntries(
      match[1]
        .split('\n')
        .filter((line) => line.includes(':'))
        .map((line) => {
          const colon = line.indexOf(':');
          return [
            line.slice(0, colon).trim(),
            line
              .slice(colon + 1)
              .split(' #')[0]
              .trim(),
          ];
        }),
    );
    if (meta.freezer_format !== 'cubes') continue;
    const asset = media.recipes[`library/${source}`];
    let image = '';
    if (asset?.photo) {
      image = `/library/images/${path.basename(asset.photo)}`;
      await copyFile(path.resolve(library, '..', asset.photo), path.join(root, 'public', image));
    }
    const body = match[2].replace(/<!-- source-media:start -->[^]*?<!-- source-media:end -->/, '');
    const sections = [...body.matchAll(/^## (.+)\n([^]*?)(?=^## |$(?![^]))/gm)].map((section) => ({
      title: section[1].trim(),
      content: clean(section[2]),
    }));
    const numbers = ['portions', 'kcal', 'protein_g', 'cube_mould_ml'];
    for (const field of numbers)
      if (!Number.isFinite(Number(meta[field]))) throw new Error(`Invalid ${field}: ${source}`);
    if (
      !sections.some((section) => section.title === 'Freeze') ||
      !sections.some((section) => section.title === 'Reheat')
    )
      throw new Error(`Missing cube instructions: ${source}`);
    recipes.push({
      id: source.replace('.md', '').replace('/', '-'),
      name: meta.name,
      label: meta.label,
      category: folder.name,
      slot: meta.slot,
      portions: Number(meta.portions),
      portion: meta.portion,
      kcal: Number(meta.kcal),
      protein: Number(meta.protein_g),
      mouldMl: Number(meta.cube_mould_ml),
      cuisine: meta.cuisine || '',
      cooker: meta.cooker || '',
      bestWith: meta.best_with || '',
      image,
      source,
      sourceUrl: asset?.publisher_url || asset?.source_url || '',
      photoTitle: asset?.original_dish || meta.name,
      videos: (asset?.videos || [])
        .filter((video) => /^https?:\/\//.test(video.url))
        .map((video) => ({ title: video.title || 'Source video', url: video.url })),
      sections,
    });
    const destination = path.join(root, 'public/library/recipes', source);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, markdown);
  }
}
recipes.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(path.join(root, 'src/data/recipes.json'), `${JSON.stringify(recipes, null, 2)}\n`);
await writeFile(
  path.join(root, 'src/data/library.json'),
  `${JSON.stringify({ source: library, count: recipes.length }, null, 2)}\n`,
);
console.log(
  `Imported ${recipes.length} active cube recipes and their local photos. Source library unchanged.`,
);
