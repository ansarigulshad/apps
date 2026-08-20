import { FILE_PATH, GITHUB_OWNER, GITHUB_REPO, TARGET_BRANCH } from './config';
import type { Birthday } from './dates';

const API_ROOT = 'https://api.github.com';

class GitHubApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function gh(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new GitHubApiError(`GitHub API ${res.status} on ${path}: ${body}`, res.status);
  }
  return res.json();
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export interface AuthedUser {
  login: string;
  avatarUrl: string;
}

export async function fetchViewer(token: string): Promise<AuthedUser> {
  const user = await gh(token, '/user');
  return { login: user.login, avatarUrl: user.avatar_url };
}

export interface BirthdaysFile {
  entries: Birthday[];
  sha: string;
}

export async function fetchBirthdays(token: string): Promise<BirthdaysFile> {
  const file = await gh(
    token,
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${TARGET_BRANCH}`
  );
  const entries: Birthday[] = JSON.parse(base64ToUtf8(file.content));
  return { entries, sha: file.sha };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export interface NewPrResult {
  url: string;
  number: number;
}

/**
 * Adds one entry to birthdays.json and opens a PR against main.
 * Never pushes to main directly — always a branch + PR, so you keep review
 * control over what actually lands.
 */
export async function openAddBirthdayPr(
  token: string,
  entry: Birthday,
  current: BirthdaysFile
): Promise<NewPrResult> {
  const branch = `add-birthday/${slugify(entry.name)}-${Date.now()}`;

  const baseRef = await gh(
    token,
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${TARGET_BRANCH}`
  );
  const baseSha: string = baseRef.object.sha;

  await gh(token, `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });

  const nextEntries = [...current.entries, entry].sort((a, b) => a.date.localeCompare(b.date));
  const content = `${JSON.stringify(nextEntries, null, 2)}\n`;

  await gh(token, `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Add birthday: ${entry.name}`,
      content: utf8ToBase64(content),
      sha: current.sha,
      branch,
    }),
  });

  const pr = await gh(token, `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Add birthday: ${entry.name}`,
      head: branch,
      base: TARGET_BRANCH,
      body: `Adds **${entry.name}** (${entry.date}) via the Birthday Bot UI.`,
    }),
  });

  return { url: pr.html_url, number: pr.number };
}
