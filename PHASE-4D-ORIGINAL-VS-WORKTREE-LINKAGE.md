# PHASE 4D — ORIGINAL VS WORKTREE LINKAGE AUDIT

## Git
- Original repo: origin https://github.com/mwcnupdaren-ux/mwcnu-pondok-aren-resmi.git, branch main, HEAD c2eb26a.
- Worktree: same origin remote, branch feat/crawlable-article-metadata, HEAD 8f58181.

## Vercel
- Original: no .vercel/project.json (likely Git-integrated production project).
- Worktree: linked to separate Vercel project `mwcnu-meta-worktree` (projectId prj_VKgH2Axw0sKMR95wQdmlkkLxJDHA). This is NOT production.

## Conclusion
- Same Git remote, different Vercel project linkage.
- Worktree is isolated; changes must be merged/pushed to main and deployed via original project's Git integration.
- Do not treat worktree's Vercel project as production.

## Recommendation
- Merge branch to main (owner approval).
- Deploy via original project (automatic on push to main or manual).
- Verify production after merge.

No changes made.
EOF
echo done