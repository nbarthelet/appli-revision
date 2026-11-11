// Publication automatique vers GitHub via l'API REST.
// Le jeton (fine-grained, restreint au seul dépôt de révisions) est stocké
// dans le localStorage du navigateur de l'utilisateur et n'est jamais
// envoyé ailleurs que vers api.github.com.

const API = 'https://api.github.com'
const LS_PAT = 'hggsp-github-token'
const LS_REPO = 'hggsp-github-repo'
const LS_BRANCH = 'hggsp-github-branch'
const LS_OWNER = 'hggsp-github-owner'

export function getSettings() {
  return {
    token: localStorage.getItem(LS_PAT) || '',
    repo: localStorage.getItem(LS_REPO) || '',
    branch: localStorage.getItem(LS_BRANCH) || 'main',
    owner: localStorage.getItem(LS_OWNER) || '',
  }
}

export function saveSettings({ token, repo, branch, owner }) {
  if (token) localStorage.setItem(LS_PAT, token.trim())
  else localStorage.removeItem(LS_PAT)
  if (repo) localStorage.setItem(LS_REPO, repo.trim())
  else localStorage.removeItem(LS_REPO)
  if (branch) localStorage.setItem(LS_BRANCH, branch.trim())
  else localStorage.setItem(LS_BRANCH, 'main')
  if (owner) localStorage.setItem(LS_OWNER, owner.trim())
  else localStorage.removeItem(LS_OWNER)
}

async function gh(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    let msg = `Erreur GitHub (${res.status})`
    try {
      const data = await res.json()
      msg = data?.message ? `${msg} : ${data.message}` : msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}

function encodePath(path) {
  return path.split('/').map((s) => encodeURIComponent(s)).join('/')
}

// Retourne le SHA actuel d'un fichier (ou null s'il n'existe pas).
async function getFileSha(owner, repo, branch, path, token) {
  try {
    const data = await gh(
      `${API}/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
      token,
    )
    return data.sha
  } catch (e) {
    if (String(e.message).includes('404')) return null
    throw e
  }
}

// Envoie (crée ou met à jour) un fichier dans le dépôt.
// Priorité au credential git local en développement (via le serveur Vite),
// sinon au jeton « Personal access token » stocké dans le navigateur.
export async function publishFile({ settings, owner, repo, branch, path, content, message }) {
  if (import.meta.env.DEV) {
    const res = await fetch('/__github/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo, branch, path, content, message }),
    }).catch(() => null)
    if (res && res.ok) {
      return res.json().catch(() => ({ ok: true }))
    }
    if (res && !settings.token) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Publication impossible.')
    }
  }
  const token = settings.token
  if (!token) {
    throw new Error(
      "Aucun jeton GitHub. Soit l'application est lancée depuis le serveur local du projet " +
        '(publication via le credential git), soit il faut saisir un jeton dans l’onglet Publier.'
    )
  }
  const sha = await getFileSha(owner, repo, branch, path, token)
  const body = {
    message: message || `Publication : ${path}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
  }
  if (sha) body.sha = sha
  await gh(`${API}/repos/${owner}/${repo}/contents/${encodePath(path)}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Vérifie qu'une connexion est possible.
// En développement, le serveur local utilise le credential git de la machine :
// aucun jeton n'est alors nécessaire dans le navigateur.
export async function testConnection({ settings, owner, repo }) {
  if (import.meta.env.DEV) {
    const res = await fetch('/__github/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo, path: '__connexion__.html', content: 'test' }),
    }).catch(() => null)
    if (res && res.ok) {
      const data = await res.json().catch(() => ({}))
      return { ok: true, name: repo, fullName: `${owner}/${repo}`, defaultBranch: 'main', via: data.via }
    }
  }
  const data = await gh(`${API}/repos/${owner}/${repo}`, settings.token)
  return {
    ok: true,
    name: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
  }
}

// Calcule le lien public d'un fichier sur GitHub Pages.
// Pages perso : https://<utilisateur>.github.io/<repo>/<path>
// (fonctionne pour un dépôt <user>.github.io également).
export function publicUrl(owner, repo, path) {
  const clean = path.replace(/^\/+/, '').replace(/\/+/g, '/')
  if (/\.github\.io$/.test(repo)) {
    return `https://${repo}/${clean}`
  }
  return `https://${owner}.github.io/${repo}/${clean}`
}

export { getSettings as _getSettings }
