## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Deploying the backend

**Never compile on the production box.** `npm run build` asks Node for 1,536 MB
of heap and the box is a 908 MB instance, so a build there only ever succeeds by
swapping: it takes around half an hour and dies whenever anything else needs
memory. On 5 Sep 2026 it was OOM-killed mid-deploy, and the failure was worse
than a failure — the kill took the parent, `tsc` survived as an orphan holding
464 MB, and every retry then failed for a reason that looked unrelated. If a
build on the box has already failed, check for a stray `tsc` before retrying:
`ps -eo pid,rss,args | grep [t]sc`.

So: **build off-box and ship the output.** Compile locally (or in CI), then send
the compiled `dist/` to the box and restart pm2. The box should receive finished
JavaScript and never run a compiler. `npm ci` there is fine — it is the TypeScript
compile that does not fit.

**Keep swap present and healthy.** The box runs a 2 GB swapfile and needs it even
without a build; confirm it with `swapon --show` before and after any change to
the instance. A box with no swap will not survive a Chromium render alongside the
app.

Whatever the method, verify the deploy landed rather than trusting the script's
own tail: check that the compiled output actually contains the change
(`grep <a new symbol> dist/...`), that the app restarted (its uptime is seconds,
not hours), and that the API answers 200. `deploy.sh` ends by printing
`pm2 logs --lines 15`, which dumps the tail of the ERROR log no matter how old it
is — a two-month-old error will appear in the output of a perfectly good deploy
and has already been mistaken for a live fault more than once.
