## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Deploying the backend

**The box can compile again, but only just.** It was a 908 MB instance and a
build there only ever succeeded by swapping — half an hour, and dead the moment
anything else wanted memory. On 5 Sep 2026 it was OOM-killed mid-deploy, and the
failure was worse than a failure: the kill took the parent, `tsc` survived as an
orphan holding 464 MB, and every retry then failed for a reason that looked
unrelated. For a while the rule here was simply _never compile on the box_.

It is a **t3.small** now — 2 vCPU, 1,905 MB — and `bash deploy.sh` completes on
it. Verified 8 Sep 2026: pull, `npm ci`, compile both packages, restart, about
two and a half minutes.

**It is not comfortable, and the margin is the swapfile.** `npm run build` asks
Node for 1,536 MB of heap; during the compile the box drops to around 140 MB
free and leans on swap, recovering afterwards. So:

- **Check swap before every on-box build** (`swapon --show`). Without it the
  build does not slow down, it dies.
- **Check for a stray `tsc` before retrying a failed one**:
  `ps -eo pid,rss,args | grep [t]sc`. That orphan is still the failure mode
  that wastes an afternoon, because the symptom it produces points elsewhere.
- **Run it detached**, as `deploy.sh`'s own header says. A dropped SSH
  connection SIGHUPs an attached build, and if that lands between the `mv` and
  the end of the compile the box is left with no `dist/` at all — nothing looks
  wrong until the next restart finds nothing to start.

**Building off-box and shipping `dist/` is still the safer option** and is what
to reach for when the box is under load, when a service run is in flight, or when
the change matters enough that a swapping compiler is a risk not worth taking.
Compile locally, `rsync` the output into `dist.new/`, swap it in, restart. `npm ci`
on the box was never the problem — it is the TypeScript compile that is tight.

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
