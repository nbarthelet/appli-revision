// Plugin de développement : publication GitHub sans jeton dans le navigateur.
//
// En mode `serve` uniquement, le serveur local Vite expose une route
// /__github/publish qui interroge l'API GitHub avec le credential git déjà
// présent sur la machine (celui qui sert au `git push`). Le jeton ne quitte
// jamais le poste et n'est jamais stocké dans le navigateur.
//
// En production (build statique), la route n'existe pas : l'application
// utilise alors le jeton « Personal access token » saisi par l'utilisateur.

import { execFile } from 'node:child_process'

const GITHUB_API = 'https://api.github.com'

function gitCredential() {
  return new Promise((resolve) => {
    const child = execFile('git', ['credential', 'fill'], (err, stdout) => {
      if (err) return resolve('')
      const out = {}
      for (const line of String(stdout).split('\n')) {
        const i = line.indexOf('=')
        if (i > 0) out[line.slice(0, i)] = line.slice(i + 1)
      }
      resolve(out.password || '')
    })
    // execFile n'accepte pas d'option `input` : on écrit sur stdin puis on le ferme,
    // sinon `git credential fill` attend indéfiniment.
    child.stdin.write('protocol=https\nhost=github.com\n\n')
    child.stdin.end()
  })
}

async function ghApi(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    signal: options.signal || AbortSignal.timeout(25000),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { message: text }
  }
  if (!res.ok) {
    const err = new Error(data?.message || `Erreur GitHub (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => {
      raw += c
      if (raw.length > 20 * 1024 * 1024) reject(new Error('Contenu trop volumineux'))
    })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

export function githubPublishDev() {
  return {
    name: 'github-publish-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__github/publish', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Méthode non autorisée' }))
          return
        }
        try {
          const { owner, repo, branch = 'main', path, content, message } = JSON.parse(
            await readBody(req)
          )
          if (!owner || !repo || !path) throw new Error('Paramètres manquants (owner, repo, path)')

          const token = await gitCredential()
          if (!token) {
            throw new Error(
              "Aucun credential git pour github.com. Lance « git push » une fois, ou saisis un jeton dans l'onglet Publier."
            )
          }

          // SHA du fichier s'il existe déjà (GitHub l'exige pour une mise à jour)
          let sha = null
          try {
            const existing = await ghApi(
              `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
              token
            )
            sha = existing.sha
          } catch (e) {
            if (e.status !== 404) throw e
          }

          const body = {
            message: message || `Publication : ${path}`,
            content: Buffer.from(content, 'utf-8').toString('base64'),
            branch,
          }
          if (sha) body.sha = sha

          const res2 = await ghApi(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, token, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              ok: true,
              via: 'credential-git',
              url: `https://${owner}.github.io/${repo}/${path}`,
              commit: res2?.commit?.html_url || null,
            })
          )
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    },
  }
}
