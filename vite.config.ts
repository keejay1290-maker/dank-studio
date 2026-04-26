import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const COMMUNITY_ROOT = 'C:\\Users\\Shadow\\Desktop\\dayz community'

const IMAGE_EXT = /\.(png|jpg|jpeg|PNG|JPG|JPEG)$/
const MAP_DIRS = ['livonia', 'sakhal', 'winterchernarus', 'winter_cher', 'winter_maps', 'winter_chernarus']

function buildCommunityManifest() {
  const builds: CommunityBuildMeta[] = []
  if (!fs.existsSync(COMMUNITY_ROOT)) return { builds }

  function scan(dir: string, parentCat: string | null = null) {
    const items = fs.readdirSync(dir)
    
    // Check if this dir itself is a build (contains .json)
    const files = items.filter(f => !fs.statSync(path.join(dir, f)).isDirectory())
    const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json'))
    
    if (jsonFiles.length > 0 && parentCat) {
      const buildName = path.basename(dir)
      const imageFiles = files.filter(f => IMAGE_EXT.test(f))
      const mainJson = jsonFiles.find(f => f.replace(/\.json$/i, '') === buildName) ?? jsonFiles[0]
      
      builds.push({
        id: `${parentCat}/${buildName}`,
        name: buildName,
        category: parentCat,
        jsonFile: mainJson,
        extraJsons: jsonFiles.filter(f => f !== mainJson),
        images: imageFiles,
      })
      return // Don't scan deeper into a build folder
    }

    // Otherwise scan subdirectories
    for (const item of items) {
      const fullPath = path.join(dir, item)
      if (!fs.statSync(fullPath).isDirectory()) continue
      
      // If we are at root, check if it's a map dir
      if (dir === COMMUNITY_ROOT) {
        if (MAP_DIRS.includes(item.toLowerCase())) {
          scan(fullPath, null) // Scan inside map dir, category is the next level
        } else {
          scan(fullPath, item) // Standard category folder
        }
      } else {
        // We are inside a category or inside a map dir
        scan(fullPath, parentCat ?? item)
      }
    }
  }

  scan(COMMUNITY_ROOT)
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
          const m = buildCommunityManifest()
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(m))
          return
        }

        if (url.startsWith('/log-api/')) {
          const downloadsPath = path.join(process.env.USERPROFILE || '', 'Downloads')
          
          if (url === '/log-api/scan') {
            if (!fs.existsSync(downloadsPath)) return res.end(JSON.stringify({ files: [] }))
            const files = fs.readdirSync(downloadsPath)
              .filter(f => /\.(adm|rpt|log)$/i.test(f))
              .map(f => {
                const stat = fs.statSync(path.join(downloadsPath, f))
                return { name: f, size: stat.size, mtime: stat.mtime }
              })
              .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ files }))
            return
          }

          if (url.startsWith('/log-api/read/')) {
            const fileName = decodeURIComponent(url.slice('/log-api/read/'.length))
            const fullPath = path.join(downloadsPath, fileName)
            if (!fullPath.startsWith(downloadsPath) || !fs.existsSync(fullPath)) {
              res.statusCode = 404
              return res.end('Not found')
            }
            res.setHeader('Content-Type', 'text/plain')
            res.end(fs.readFileSync(fullPath, 'utf8'))
            return
          }
        }

        if (url.startsWith('/file/')) {
          const parts = url.slice('/file/'.length).split('/').map(decodeURIComponent)
          let fullPath = path.join(COMMUNITY_ROOT, ...parts)

          // If not found directly, check inside map folders
          if (!fs.existsSync(fullPath)) {
            for (const map of MAP_DIRS) {
              const altPath = path.join(COMMUNITY_ROOT, map, ...parts)
              if (fs.existsSync(altPath)) {
                fullPath = altPath
                break
              }
            }
          }

          if (!fullPath.startsWith(COMMUNITY_ROOT)) {
            res.statusCode = 403
            res.end('Forbidden')
            return
          }
          if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
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
