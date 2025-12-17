
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'save-config',
        configureServer(server) {
          server.middlewares.use('/save-rig-config', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  const filePath = path.resolve('src/data/EntityRigDefinitions.ts');
                  // We need to preserve the export const syntax
                  const content = `export const ENTITY_RIGS = ${JSON.stringify(data, null, 4)};`;
                  fs.writeFileSync(filePath, content);
                  res.statusCode = 200;
                  res.end('Saved');
                } catch (e) {
                  console.error(e);
                  res.statusCode = 500;
                  res.end('Error saving');
                }
              });
            } else {
              next();
            }
          });

          // NEW: Asset Saver Middleware
          server.middlewares.use('/save-asset', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  // data: { path: string, image: string (base64) }

                  // Security: Ensure path doesn't escape project
                  const targetPath = path.resolve(process.cwd(), data.path);
                  if (!targetPath.startsWith(process.cwd())) {
                    res.statusCode = 403;
                    res.end('Forbidden path');
                    return;
                  }

                  // Create directory if it doesn't exist
                  const dir = path.dirname(targetPath);
                  if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                  }

                  // Decode Base64
                  const base64Data = data.image.replace(/^data:image\/png;base64,/, "");
                  fs.writeFileSync(targetPath, base64Data, 'base64');

                  console.log(`[Vite] Saved asset to ${targetPath}`);
                  res.statusCode = 200;
                  res.end('Saved Asset');
                } catch (e) {
                  console.error('[Vite] Error saving asset:', e);
                  res.statusCode = 500;
                  res.end('Error saving asset');
                }
              });
            } else {
              next();
            }
          });

          // NEW: Registry Saver Middleware
          server.middlewares.use('/save-registry-entry', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                try {
                  const payload = JSON.parse(body); // { type: 'heads'|'weapons'|'armor', item: any }
                  const { type, item } = payload;

                  let fileName = '';
                  if (type === 'heads') fileName = 'heads.json';
                  else if (type === 'weapons') fileName = 'weapons.json';
                  else if (type === 'armor') fileName = 'armor.json';
                  else throw new Error('Invalid type');

                  const filePath = path.resolve('src/data/registries', fileName);
                  let currentData = [];
                  if (fs.existsSync(filePath)) {
                    const fileContent = fs.readFileSync(filePath, 'utf-8');
                    if (fileContent.trim()) {
                      currentData = JSON.parse(fileContent);
                    }
                  }

                  // Check for duplicates
                  let exists = false;
                  if (typeof item === 'string') {
                    exists = currentData.includes(item);
                  } else if (item.id) {
                    exists = currentData.some((x: any) => x.id === item.id);
                  }

                  if (!exists) {
                    currentData.push(item);
                    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 4));
                    console.log(`[Vite] Added entry to ${fileName}`);
                  } else {
                    // Update existing
                    if (typeof item !== 'string' && item.id) {
                      const idx = currentData.findIndex((x: any) => x.id === item.id);
                      if (idx !== -1) currentData[idx] = item;
                      fs.writeFileSync(filePath, JSON.stringify(currentData, null, 4));
                      console.log(`[Vite] Updated entry in ${fileName}`);
                    }
                  }

                  res.statusCode = 200;
                  res.end('Saved Registry Entry');
                } catch (e) {
                  console.error('[Vite] Error saving registry:', e);
                  res.statusCode = 500;
                  res.end('Error saving registry: ' + e);
                }
              });
            } else {
              next();
            }
          });

          // NEW: Animation Saver Middleware
          server.middlewares.use('/save-animations', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  const filePath = path.resolve('src/data/AnimationData.ts');

                  // Generate imports
                  let content = "import { AnimationClip, MeleeAttackPhase } from '../types';\n";
                  content += "import { DEFAULT_TRANSFORM } from '../utils/animationUtils';\n\n";
                  content += `export const ANIMATION_LIBRARY: Record<string, AnimationClip> = ${JSON.stringify(data, null, 4)};`;

                  fs.writeFileSync(filePath, content);
                  console.log('[Vite] Saved Animation Data');
                  res.statusCode = 200;
                  res.end('Saved Animations');
                } catch (e) {
                  console.error('[Vite] Error saving animations:', e);
                  res.statusCode = 500;
                  res.end('Error saving animations');
                }
              });
            } else {
              next();
            }
          });

          // NEW: World Data Saver Middleware
          server.middlewares.use('/save-world-data', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                try {
                  const data = JSON.parse(body); // { objects: WorldObject[] }
                  const filePath = path.resolve('src/data/WorldObjects.ts');

                  // Generate TypeScript file content
                  const content = `import { WorldObject } from '../types';\n\nexport const SAVED_WORLD_OBJECTS: WorldObject[] = ${JSON.stringify(data.objects, null, 4)};\n\nexport const SAVED_TILE_MAP: any[] = ${JSON.stringify(data.tileMap || [], null, 4)};`;

                  fs.writeFileSync(filePath, content);
                  console.log('[Vite] Saved World Data to src/data/WorldObjects.ts');

                  res.statusCode = 200;
                  res.end('Saved World Data');
                } catch (e) {
                  console.error('[Vite] Error saving world data:', e);
                  res.statusCode = 500;
                  res.end('Error saving world data');
                }
              });
            } else {
              next();
            }
          });

          // NEW: Spell Registry Saver
          server.middlewares.use('/save-spell-config', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                try {
                  const registry = JSON.parse(body);
                  const filePath = path.resolve('src/modules/spells/SpellRegistry.ts');

                  let fileContent = fs.readFileSync(filePath, 'utf-8');

                  // Find the start of the variable declaration
                  const marker = 'export const SPELL_REGISTRY: Record<string, SpellDefinition> =';
                  const idx = fileContent.indexOf(marker);

                  if (idx !== -1) {
                    // Keep header
                    const header = fileContent.substring(0, idx);
                    // Reconstruct file
                    const newContent = header + marker + ' ' + JSON.stringify(registry, null, 4) + ';';

                    fs.writeFileSync(filePath, newContent);
                    console.log('[Vite] Saved Spell Registry');
                    res.statusCode = 200;
                    res.end('Saved Spells');
                  } else {
                    throw new Error('Could not find SPELL_REGISTRY marker');
                  }
                } catch (e) {
                  console.error('[Vite] Error saving spells:', e);
                  res.statusCode = 500;
                  res.end('Error saving spells');
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      }
    }
  };
});
