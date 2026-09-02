import type { DataAdapter } from 'obsidian';
import type { SidecarIndexLocation } from './types';

/**
 * Normalize and validate a user-supplied vault-relative sidecar directory.
 *
 * Obsidian adapters use POSIX-style vault paths even on Windows. Keeping this
 * contract here makes the settings UI and the boot-time resolver agree, and
 * prevents a custom setting from escaping the vault through an absolute path
 * or `..` segment.
 */
function parseVaultRelativePath(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const raw = value.trim().replaceAll('\\', '/');
    if (!raw || raw.startsWith('/') || raw.startsWith('//') || /^[A-Za-z]:/.test(raw)) return null;
    if (raw.includes('\u0000') || [...raw].some(ch => ch.charCodeAt(0) < 0x20)) return null;

    const parts = raw.split('/').filter(Boolean);
    if (parts.length === 0 || parts.length > 8) return null;
    if (parts.some(part => part === '.' || part === '..' || part.includes(':'))) return null;
    if (parts.some(part => part.length > 180)) return null;

    return parts.join('/');
}

export function parseSidecarCustomPath(value: unknown): string | null {
    const normalized = parseVaultRelativePath(value);
    if (!normalized) return null;
    const first = normalized.split('/')[0];
    // A custom path is the visible-vault escape hatch. Keep .obsidian behind
    // the explicit built-in `config` choice so split-config Sync semantics do
    // not silently return through the custom setting.
    return first.toLowerCase() === '.obsidian' ? null : normalized;
}

/** Resolve a persisted location, with malformed runtime data safely on config. */
export function resolveSidecarPath(
    location: SidecarIndexLocation,
    customPath: unknown,
    configDir: string,
    visibleDir: string,
): string {
    if (location === 'visible') return visibleDir;
    if (location === 'custom') return parseSidecarCustomPath(customPath) ?? configDir;
    return configDir;
}

/** Return true only for Seek's exact sidecar artifacts (including atomic-write temps). */
export function isSidecarArtifactPath(path: string): boolean {
    const name = path.slice(path.lastIndexOf('/') + 1);
    return /^(?:embeddings\.[A-Za-z0-9-]+\.\d+\.bin|index\.[A-Za-z0-9-]+\.jsonl|meta\.[A-Za-z0-9-]+\.json|bm25\.[A-Za-z0-9-]+\.json\.gz)(?:\.tmp)?$/.test(name);
}

export function selectSidecarArtifactPaths(paths: string[]): string[] {
    return paths.filter(isSidecarArtifactPath);
}

/** Create missing parent folders one segment at a time. */
export async function ensureVaultDirRecursive(adapter: Pick<DataAdapter, 'exists' | 'mkdir'>, dir: string): Promise<void> {
    let current = '';
    for (const segment of dir.split('/').filter(Boolean)) {
        current = current ? `${current}/${segment}` : segment;
        if (!(await adapter.exists(current))) await adapter.mkdir(current);
    }
}

/** Stable per-plugin/per-vault key for the last resolved sidecar directory. */
export function sidecarLastDirKey(pluginId: string, vaultScope: string): string {
    return `${pluginId}:${vaultScope}-sidecar-last-dir`;
}

export function readSidecarLastDir(pluginId: string, vaultScope: string): string | null {
    try {
        return parseVaultRelativePath(window.localStorage.getItem(sidecarLastDirKey(pluginId, vaultScope)));
    } catch {
        return null;
    }
}

export function writeSidecarLastDir(pluginId: string, vaultScope: string, dir: string): void {
    try {
        window.localStorage.setItem(sidecarLastDirKey(pluginId, vaultScope), dir);
    } catch {
        // localStorage can be unavailable in restricted WebViews. The sidecar
        // itself remains functional; this only forfeits path-change migration.
    }
}
