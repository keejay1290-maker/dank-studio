import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const COMMUNITY_ROOT = 'C:\\Users\\Shadow\\Desktop\\dayz community'

const IMAGE_EXT = /\.(png|jpg|jpeg|PNG|JPG|JPEG)$/

function buildCommunityManifest() {
  const builds: CommunityBuildMeta[] = []
  if (!fs.existsSync(COMMUNITY_ROOT)) return { builds }

  for (const cat of fs.readdirSync(COMMUNITY_ROOT)) {
    const catPath = path.join(COMMUNITY_ROOT, cat)
    if (!fs.statSync(catPath).isDirectory()) continue

    for (const buildName of fs.readdirSync(catPath)) {
      const buildPath = path.join(catPath, buildName)
      if (!fs.statSync(buildPath).isDirectory()) continue

      const files = fs.readdirSync(buildPath)
      const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json'))
      const imageFiles = files.filter(f => IMAGE_EXT.test(f))

      if (jsonFiles.length === 0) continue

      const mainJson = jsonFiles.find(f => f.replace(/\.json$/i, '') === buildName) ?? jsonFiles[0]

      builds.push({
        id: `${cat}/${buildName}`,
        name: buildName,
        category: cat,
        jsonFile: mainJson,
        extraJsons: jsonFiles.filter(f => f !== mainJson),
        images: imageFiles,
      })
    }
  }

  return { builds }
}

interface CommunityBuildMeta {
  id: string
  name: string
  category: string
  jsonFile: string
  extraJsons: string[]
  images: string[]
}

function communityBuildsPlugin() {
  let manifest: ReturnType<typeof buildCommunityManifest> | null = null

  return {
    name: 'community-builds-api',
    configureServer(server: any) {
      server.middlewares.use('/community-api', (req: any, res: any, next: any) => {
        const url: string = req.url ?? '/'

        if (url === '/manifest' || url === '/manifest.json') {
          if (!manifest) manifest = buildCommunityManifest()
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(manifest))
          return
        }

        if (url.startsWith('/file/')) {
          const parts = url.slice('/file/'.length).split('/').map(decodeURIComponent)
          const fullPath = path.join(COMMUNITY_ROOT, ...parts)

          if (!fullPath.startsWith(COMMUNITY_ROOT)) {
            res.statusCode = 403
            res.end('Forbidden')
            return
          }
          if (!fs.existsSync(fullPath)) {
            res.statusCode = 404
            res.end('Not found')
            return
          }

          const ext = path.extname(fullPath).toLowerCase()
          const mime =
            ext === '.json' ? 'application/json' :
            ext === '.png'  ? 'image/png' :
            (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' :
            'application/octet-stream'

          res.setHeader('Content-Type', mime)
          res.setHeader('Cache-Control', 'max-age=3600')
          res.end(fs.readFileSync(fullPath))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), communityBuildsPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
})
