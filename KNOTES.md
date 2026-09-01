# K_Notes Seek fork

This repository is a rebase-friendly fork of [Seek](https://github.com/ryan-manor/Obsidian-Seek) for the K_Notes integration plan. It keeps the plugin id `seek`; the current K_Notes release is `1.1.4`.

Remotes:

- `origin` = `https://github.com/kalkin7/Obsidian-Seek-knotes.git` (our `knotes` branch)
- `upstream` = `https://github.com/ryan-manor/Obsidian-Seek.git` (official Seek)

Work on `knotes`. Do not open a PR to upstream unless that is an explicit later decision. Do not install this fork over production K_Notes Seek.

## Release 1.1.4

The W1/W3 changes are published as the BRAT-compatible GitHub Release `1.1.4`:

- `https://github.com/kalkin7/Obsidian-Seek-knotes`
- Release assets: `main.js`, `manifest.json`, and `styles.css`
- BRAT: **Add Beta plugin** → `kalkin7/Obsidian-Seek-knotes`

The source branch is `knotes`; generated `main.js` remains a release/build artifact and is not tracked in Git.

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

The tracked `knotes-patches/` directory contains the W1 and W3 patches. Keep it synchronized with the commits on `knotes`; the patch files are review/export artifacts, not a second source of truth.

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
