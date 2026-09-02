# K_Notes Seek fork

This repository is a rebase-friendly fork of [Seek](https://github.com/ryan-manor/Obsidian-Seek) for the K_Notes integration plan. It keeps the plugin id `seek`; the current K_Notes release is `1.1.6`.

Remotes:

- `origin` = `https://github.com/kalkin7/Obsidian-Seek-knotes.git` (our `knotes` branch)
- `upstream` = `https://github.com/ryan-manor/Obsidian-Seek.git` (official Seek)

Work on `knotes`. Do not open a PR to upstream unless that is an explicit later decision. Do not install this fork over production K_Notes Seek.

## Release 1.1.4

The W1/W3 changes are published as the BRAT-compatible GitHub Release `1.1.4`:

- `https://github.com/kalkin7/Obsidian-Seek-knotes`
- Release assets: `main.js`, `manifest.json`, and `styles.css`
- BRAT: **Add Beta plugin** → `kalkin7/Obsidian-Seek-knotes`

The source branch is `knotes`; generated `main.js` remains a release/build artifact and is not tracked in Git. The default `main` branch now carries the active tag-release workflow (`2f4be6a`, synchronized on `knotes` as `e065bea`), so future semver tag pushes from `knotes` publish releases automatically. Release `1.1.4` predates that workflow and was published manually.

## Rebase cookbook

From this repository:

```powershell
Set-Location "C:\Users\manager\Dev\Obsidian-Seek-knotes"
git fetch upstream
git switch knotes
git rebase upstream/main
```

The expected conflict area is `src/chunker.ts`, in `parseFrontmatter`. Preserve both parser fixes when resolving conflicts:

- W1 keeps the list-item expression `^\s+-\s*(.+)\r?$` so CRLF YAML alias lists retain values such as `엘지유플러스`.
- W3 keeps `yaml.split(/\r?\n/)` and the Unicode-key expression `^[\p{L}\p{N}_-]+:\s*(.*)\r?$` with the `u` flag, so Hangul property keys persist alongside ASCII keys.

After resolving a conflict, inspect the result and continue normally:

```powershell
git add src/chunker.ts
git rebase --continue
```

## Exporting patches

After rebasing, regenerate the exported patches from the upstream baseline. Remove stale patch files first if the commit set changed, then run:

```powershell
Remove-Item .\knotes-patches\*.patch -ErrorAction SilentlyContinue
git format-patch upstream/main --output-directory knotes-patches
```

The tracked `knotes-patches/` directory contains the W1/W3 parser patches and the custom sidecar-path patches (`0005`/`0006`). Keep it synchronized with the commits on `knotes`; the patch files are review/export artifacts, not a second source of truth.

## What the patches fix

- `0001-fix-chunker-parse-CRLF-YAML-alias-lists-W1.patch` fixes CRLF block-list parsing in `parseFrontmatter`. It closes the alias-indexing hole where a note such as `8_Wiki/entities/업체_LG_U+.md` lost `엘지유플러스` from `chunk.metadata.aliases`.
- `0002-fix-chunker-accept-Unicode-frontmatter-property-keys.patch` fixes CRLF normalization and Unicode frontmatter property keys. It keeps keys such as `상태` and `보험접수번호` in persisted `chunk.metadata.properties`, while retaining ASCII keys such as `document_type`.

## Installation boundary and later live checks

Do **not** install or copy this fork over the production K_Notes Seek plugin at:

```text
C:\Cloud\GoogleDrive(HSC)\2_Areas\Apps\Obsidian\Vault\K_Notes\.obsidian\plugins\seek\
```

The 1.1.4 source and build were verified, and the isolated test-vault live checks passed. Production K_Notes was not overwritten. The confirmation queries used were:

```text
엘지유플러스
상태:최종 결과보고서 수령 완료
보험접수번호:2025-9883784
```

Do not use `vault=K_Notes` or the `obsidian` search command as part of this fork's verification.

## Custom sidecar index folder

Seek's Index settings now have a `Custom vault folder` option. Enter a vault-relative path such as `9_system/seek-index` in `sidecarIndexCustomPath`; absolute paths, `..`, and `.obsidian` (case-insensitive) are rejected. Existing `config` and `visible` choices are unchanged. The selected directory is captured on reload, and Seek moves the previous sidecar files before hydrate when possible, so changing the location does not require re-embedding. The sidecar file format and `search.ts`/`sidecar.ts` contracts are unchanged.

This feature is intentionally isolated to `src/sidecar-path.ts` plus small hooks in `types.ts`, `settings-tab.ts`, and `main.ts`. When rebasing, resolve conflicts in those hooks while keeping upstream changes in the surrounding code. Do not hand-edit `knotes-patches/`; regenerate it from the resulting commits.

## BRAT release checklist

BRAT installs the GitHub Release assets, so a release must use a new tag matching `manifest.json.version` and must attach the CI-built `main.js`, `manifest.json`, and `styles.css`. From `knotes`:

```powershell
npm test
npm run typecheck
npm run build
npm version patch
# npm version updates package.json, manifest.json, and versions.json, then creates the tag
git push origin knotes --follow-tags
```

The tag starts `.github/workflows/release.yml`, which publishes the release automatically after CI tests and builds the three assets. If a tag push does not create a run, start the same workflow manually with `gh workflow run Release --ref <version>`. Verify the release assets, then add `kalkin7/Obsidian-Seek-knotes` to BRAT. Keep the plugin id `seek`, and never reuse an already-published version. If upstream uses the same version after a rebase, bump the fork to the next patch version before releasing. The fork's release is intentionally separate from upstream and must not overwrite the production K_Notes installation.
