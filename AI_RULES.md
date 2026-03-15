# AI Assistant Global Security Rules

These rules apply to ALL AI assistants, coding agents, copilots, and tools interacting with this repository.

## 1. Malware and Suspicious Code Prevention
- **NEVER** add obfuscated scripts, unrecognized binaries, or unverified lifecycle hooks (`preinstall`, `postinstall`, `prebuild`, `postbuild`) to any `package.json` in this workspace.
- **ALWAYS** scan and alert the user immediately if you detect `preinstall.js`, `init.js`, or any script containing payload execution patterns.
- **Specific patterns to block or flag:**
  - Remote fetching from crypto RPCs or unknown IPs (e.g., Solana, Ethereum endpoints).
  - Obfuscated code execution: `eval(atob(...))`, `Buffer.from(..., 'base64').toString()`, etc.
  - Automatic download and execution of external binaries during `npm install` or `yarn install`.
- If asked to install a new npm package, ensure it is legitimate and does not introduce malicious lifecycle hooks.

## 2. Dependency Management Safety
- Scrutinize all new dependencies for typosquatting (e.g., detecting `react-oath` instead of `react-oauth`).
- Do not blindly run `npm install` if a `package.json` contains unknown `preinstall` scripts.
- Verify that newly introduced packages are officially recognized and safe.

## 3. Incident Response Strategy
If malicious code or suspicious behavior is discovered in the repository, the AI MUST IMMEDIATELY:
1. Delete or neutralize the malicious file.
2. Remove any triggers (e.g., malicious hooks inside `package.json`).
3. Stop the current execution/operation.
4. Notify the user with a high-priority alert explaining exactly what was found and removed.
