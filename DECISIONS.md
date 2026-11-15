# DECISIONS

- **Node.js install (16 Nov 2026).** The machine had no Node and no package manager (no Homebrew). Node 24.22.3 and npm 12.2.2 were unpacked from the npm registry tarballs (`node-bin-darwin-arm64`, `npm`) into `tools.nosync/` inside this folder — nothing installed outside the project. Use `export PATH="$PWD/tools.nosync/bin:$PATH"`.
- **`.nosync` folders.** The project sits in iCloud Drive. `tools.nosync/` and `node_modules.nosync/` (symlinked as `node_modules`) carry the `.nosync` suffix so iCloud does not try to sync tens of thousands of dependency files.
- **Git identity.** No global git identity was configured; commits use the GitHub no-reply address of the signed-in `gh` account so no private e-mail is published.
