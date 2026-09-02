import { describe, expect, it } from 'vitest';
import { isSidecarArtifactPath, parseSidecarCustomPath, ensureVaultDirRecursive, resolveSidecarPath, selectSidecarArtifactPaths } from './sidecar-path';
import type { SidecarIndexLocation } from './types';

describe('parseSidecarCustomPath', () => {
    it('normalizes Windows separators and repeated/trailing separators', () => {
        expect(parseSidecarCustomPath('  9_system\\seek-index\\  ')).toBe('9_system/seek-index');
        expect(parseSidecarCustomPath('9_system//seek-index')).toBe('9_system/seek-index');
    });

    it.each([
        '',
        '   ',
        '../outside',
        '9_system/../outside',
        './9_system',
        '/absolute/path',
        '\\absolute\\path',
        '//server/share',
        'C:\\outside',
        '.obsidian/custom',
        '.Obsidian/custom',
        '9_system:bad',
        '9_system\0bad',
    ])('rejects unsafe path %j', path => {
        expect(parseSidecarCustomPath(path)).toBeNull();
    });

    it('accepts a Unicode vault-relative folder', () => {
        expect(parseSidecarCustomPath('9_system/검색 인덱스')).toBe('9_system/검색 인덱스');
    });
});

describe('isSidecarArtifactPath', () => {
    it('moves only exact Seek artifacts and atomic-write temps', () => {
        expect(isSidecarArtifactPath('9_system/index.desktop-abc.jsonl')).toBe(true);
        expect(isSidecarArtifactPath('9_system/embeddings.desktop-abc.0.bin.tmp')).toBe(true);
        expect(isSidecarArtifactPath('9_system/meta.desktop-abc.json')).toBe(true);
        expect(isSidecarArtifactPath('9_system/bm25.desktop-abc.json.gz')).toBe(true);
        expect(isSidecarArtifactPath('9_system/Note.md')).toBe(false);
        expect(isSidecarArtifactPath('9_system/index.desktop-abc 2.jsonl')).toBe(false);
        expect(selectSidecarArtifactPaths([
            '9_system/index.desktop-abc.jsonl',
            '9_system/Note.md',
            '9_system/meta.desktop-abc.json',
        ])).toEqual(['9_system/index.desktop-abc.jsonl', '9_system/meta.desktop-abc.json']);
    });
});

describe('resolveSidecarPath', () => {
    const config = '.obsidian/plugins/seek/index';
    const visible = 'Seek Index';

    it.each([
        ['config', '9_system/other', config],
        ['visible', '9_system/other', visible],
        ['custom', '9_system/seek-index', '9_system/seek-index'],
        ['custom', '../outside', config],
    ] as Array<[SidecarIndexLocation, string, string]>)('resolves %s safely', (location, customPath, expected) => {
        expect(resolveSidecarPath(location, customPath, config, visible)).toBe(expected);
    });
});

describe('ensureVaultDirRecursive', () => {
    it('creates missing parent folders before the leaf', async () => {
        const folders = new Set<string>();
        const adapter = {
            exists: async (path: string) => folders.has(path),
            mkdir: async (path: string) => { folders.add(path); },
        };

        await ensureVaultDirRecursive(adapter, '9_system/seek-index');
        expect([...folders]).toEqual(['9_system', '9_system/seek-index']);
    });
});
