---
description: Security Checks and Malware Prevention
---

# Security Verification Workflow

Whenever updating dependencies or reviewing `package.json`:
1. Check for `preinstall`, `postinstall`, `prebuild`, or `postbuild` hooks.
2. If any hook points to a cryptic local script (like `preinstall.js` or `init.js`), review the contents immediately.
3. Search the file for `eval`, `atob`, `Buffer.from(..., 'base64')`, or remote fetch requests to unknown APIs (such as Solana RPC endpoints).
4. If malware is found, immediately delete the file, remove the hook from `package.json`, and notify the user.

// turbo-all
