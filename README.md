<h1 align="center">Hi 👋, I'm Konrad</h1>
<h3 align="center">Backend engineer building .NET systems, AI tools, and developer infrastructure</h3>

I'm a software engineer with **10 years of commercial experience** across e-commerce, energy, and enterprise domains. My core stack is **.NET, C#, Azure, and microservices** - building distributed systems that handle real load on real infrastructure.

In day-to-day development I mainly use **Claude Code** and **GitHub Copilot**, plus **local models**.

When I build something useful and repeatable, I open-source it. Right now that means **AI observability platforms**, **evaluation benches and tooling for coding agents**, and **books and flashcards for .NET engineers**.

---

## 🚀 Featured projects

<table>
<tr>
<td width="50%" valign="top">

### [architecture-standards](https://github.com/konradcinkusz/architecture-standards)

An architecture constitution for .NET Aspire on Fly.io and Azure - 15 principles and
17 operational guides, readable as documentation and installable as agent plugins for
Claude Code, Copilot and VS Code.

[![Last commit](https://img.shields.io/github/last-commit/konradcinkusz/architecture-standards?style=flat-square&labelColor=1a1b27&color=58a6ff)](https://github.com/konradcinkusz/architecture-standards/commits/main "Last commit")

</td>
<td width="50%" valign="top">

### [agent-eval-bench](https://github.com/konradcinkusz/agent-eval-bench)

A spec-first evaluation bench for tool-using agents: 35 YAML scenarios, 313 assertions
over the execution trace, a deterministic layer that gates every pull request, and a
rubric judge that reports `skipped` rather than green without credentials.

[![Last commit](https://img.shields.io/github/last-commit/konradcinkusz/agent-eval-bench?style=flat-square&labelColor=1a1b27&color=58a6ff)](https://github.com/konradcinkusz/agent-eval-bench/commits/main "Last commit")

</td>
</tr>
<tr>
<td width="50%" valign="top">

### [CopilotScope](https://github.com/konradcinkusz/copilot-scope)

AI coding-session observability - an OTLP collector with a hand-written protobuf
decoder, a Postgres store, and a Blazor dashboard that scores session quality rather
than token spend, across five assistants.

[![Last commit](https://img.shields.io/github/last-commit/konradcinkusz/copilot-scope?style=flat-square&labelColor=1a1b27&color=58a6ff)](https://github.com/konradcinkusz/copilot-scope/commits/master "Last commit")

</td>
<td width="50%" valign="top">

### [authservice](https://github.com/konradcinkusz/authservice)

Standalone auth microservice for ASP.NET Core: JWT with rotating refresh tokens and
reuse detection, RS256 with published JWKS, Google/GitHub OAuth, multi-tenant
organizations, and an append-only audit log.

[![Last commit](https://img.shields.io/github/last-commit/konradcinkusz/authservice?style=flat-square&labelColor=1a1b27&color=58a6ff)](https://github.com/konradcinkusz/authservice/commits/main "Last commit")

</td>
</tr>
<tr>
<td width="50%" valign="top">

### [llm-multi-agent-chess](https://github.com/konradcinkusz/llm-multi-agent-chess)

Two LLM-powered chess agents battle through a Streamlit interface with configurable
personalities and real-time board visualisation.

[![Last commit](https://img.shields.io/github/last-commit/konradcinkusz/llm-multi-agent-chess?style=flat-square&labelColor=1a1b27&color=58a6ff)](https://github.com/konradcinkusz/llm-multi-agent-chess/commits "Last commit")

</td>
<td width="50%" valign="top"></td>
</tr>
</table>

---

## 🛠️ Open source projects

The open source projects I actively maintain, grouped by what they are for.

### 🤖 AI tooling and agent engineering

| Project | Description |
| --- | --- |
| [agent-eval-bench](https://github.com/konradcinkusz/agent-eval-bench) | A spec-first evaluation bench for tool-using agents: 35 YAML scenarios, 313 assertions over the execution trace, a deterministic layer that gates every pull request, and a rubric judge that reports `skipped` rather than green without credentials |
| [listing-search-bench](https://github.com/konradcinkusz/listing-search-bench) | The same evaluation method applied to a hybrid search ranker: a contract written before the pipeline, 28 scenarios and 128 assertions over the execution trace - 22% of them asserting absence - plus a mutation pass that proves the suite can fail |
| [payments-bench](https://github.com/konradcinkusz/payments-bench) | The same bench method applied to an outbound bank-transfer service: idempotent initiation, a payment state machine, unknown outcomes resolved instead of blindly retried, a transactional outbox, a double-entry ledger and reconciliation, against a partner simulator that injects faults. A register says what has and has not been proved, and there is no real bank |
| [judge-worker](https://github.com/konradcinkusz/judge-worker) | LLM-as-a-judge post-processing worker: Redis/BullMQ batching, mutation-tested judge reliability, and human-calibrated scoring |
| [CopilotScope](https://github.com/konradcinkusz/copilot-scope) | AI coding-session observability - an OTLP collector with a hand-written protobuf decoder, a Postgres store, and a Blazor dashboard that scores session quality rather than token spend, across five assistants |
| [claude-scope](https://github.com/konradcinkusz/claude-scope) | Session forensics for coding agents - a `/session-report` skill that turns a session's own transcript into token, timing and conversation-shape analytics with a visual timeline; the script does every calculation and the model never does arithmetic |
| [context-pin](https://github.com/konradcinkusz/context-pin) | A versioned rules manifest for coding agents: publish standards once, pin each repository to a version and a channel, and let CI detect drift between its lock file and what is currently published - without a network call on the hot path |
| [spec-driven-template](https://github.com/konradcinkusz/spec-driven-template) | A GitHub template for starting a product from a specification: decisions, spec and task documents filled in before any code, a supervisor protocol that delegates single tasks to sub-sessions, and two CI checks that keep the documents honest |
| [exit-interview-agent](https://github.com/konradcinkusz/exit-interview-agent) | An open-source agent for structured exit interviews - bring your own model through MCP, the CLI with an API key, or a local model - with privacy-preserving employer signals and an eval harness that scores interview quality from OpenTelemetry traces. Not deployed |
| [AgentHelm](https://github.com/konradcinkusz/agent-helm) | Web cockpit for AI coding agents - drive GitHub Copilot CLI, Claude Code, and Gemini via the Agent Client Protocol with permission policies, audit trail, and git diff review |
| [chess-mas](https://github.com/konradcinkusz/chess-mas) | Multi-agent chess in C#, orchestrated with .NET Aspire and Microsoft Agent Framework, with cost tracking against Azure AI Foundry |

### 🏗️ Platform, architecture and backend

| Project | Description |
| --- | --- |
| [architecture-standards](https://github.com/konradcinkusz/architecture-standards) | An architecture constitution for .NET Aspire on Fly.io and Azure - 15 principles and 17 operational guides, readable as documentation and installable as agent plugins for Claude Code, Copilot and VS Code |
| [architecture-standards-init-example](https://github.com/konradcinkusz/architecture-standards-init-example) | What that constitution produces when pointed at an empty repository - one Aspire composition root, a 477-line shared kernel with the ceiling enforced in CI, a Next.js surface reading config per request, three Fly apps and eight workflows, and deliberately no domain model |
| [authservice](https://github.com/konradcinkusz/authservice) | Standalone auth microservice for ASP.NET Core: JWT with rotating refresh tokens and reuse detection, RS256 with published JWKS, Google/GitHub OAuth with provider-side email verification, multi-tenant organizations, and an append-only audit log |
| [gh-runner-kit](https://github.com/konradcinkusz/gh-runner-kit) | Ephemeral self-hosted GitHub Actions runners in Docker: one folder per repository, a local browser control panel, scheduled disk cleanup, and a `RUNNER_LABELS` variable that switches a workflow between self-hosted and GitHub-hosted - the practice described in the self-hosted-runners guide of architecture-standards |
| [Let's go Legacy](https://github.com/konradcinkusz/letsgolegacy.secondkey) | Tooling for verifying AI-assisted .NET migrations: **Second Key** records how the legacy system behaves, replays it against the migrated version and checks every difference against a written contract; [**Portcullis**](https://github.com/konradcinkusz/letsgolegacy.portcullis) is a diff-scoped Roslyn gate for CI; [**Legacy Risk Scan**](https://github.com/konradcinkusz/letsgolegacy.legacy-risk-scan) is a free in-browser end-of-life and vulnerability report for a `.csproj`, `packages.config` or `composer.json` |
| [school-search](https://github.com/konradcinkusz/school-search) | A search and ranking portal for Polish primary schools: it finds the catchment school for an address and shows its results, trend and how much confidence the data supports, with moderated reviews and a read-only MCP server. Aspire, several services, in development |
| [parcel-number-generator](https://github.com/konradcinkusz/parcel-number-generator) | A warehousing system modernized from a 2018 .NET Framework solution: a finite parcel-number pool with exclusions and three allocation strategies, a notification service absorbed from a second repository, an operator console, and CI that fails a model drifted from its migrations |

### 📚 Books, flashcards and teaching

| Project | Description |
| --- | --- |
| [MAF for .NET Engineers](https://github.com/konradcinkusz/maf-book) | Practitioner's guide to Microsoft Agent Framework 1.0 for .NET - agents, tools, MCP, graph-based workflows, multi-agent orchestration, middleware, and hosting, with samples that run against a local model |
| [LangChain, LangGraph and Async Python](https://github.com/konradcinkusz/llm-book) | Practitioner's guide to LangChain 1.x and LangGraph for engineers arriving from .NET - async Python, cancellation, persistence, interrupts, context engineering, and five specified measurement experiments |
| [Mathematics for AI Engineers](https://github.com/konradcinkusz/math-for-ai-engineers) | From arithmetic to scaled dot-product attention in 47 programmed-learning programs; English and Polish from one source, every number computed by a script and re-checked on every build |
| [Python for .NET Engineers](https://github.com/konradcinkusz/python-for-csharp-developers) | Reading, writing and shipping Python when C# is your first language - English and Polish editions from one source, with a guiding project (trace-assert) that the book's own CI builds and runs |
| [Staff AI Engineer Preparation Kit](https://github.com/konradcinkusz/staff-ai-engineer-preparation-kit) | A book, fill-in templates and five printable cards for an experienced engineer aiming at Staff-level AI engineering roles; company-independent by construction, with build gates that refuse named employers and unsourced figures |
| [Chaos from Zero](https://github.com/konradcinkusz/chaos-theory-for-dummies) | From school arithmetic to the Lorenz attractor and weather ensembles, in English and Polish; every number the book prints was computed by a Python program the build runs |
| [Ops Copilot](https://github.com/konradcinkusz/llm-book-mini-project) | The companion project to the LangChain book, built one stage per chapter; every stage's tests pass without a single real model call |
| [LetsDoSQL](https://github.com/konradcinkusz/LetsDoSQL) | Twenty SQL exercises on the Wide World Importers database, from joins to window functions, each with an explanation and a solution, compiled into one PDF |
| [Angular FlashCards](https://github.com/konradcinkusz/AngularFlashCards) and [Transformers FlashCards](https://github.com/konradcinkusz/Transformers-FlashCards) | Beamer Q&A flashcard decks: Angular and JavaScript fundamentals, and the Transformer architecture from the ground up |
| [.NET Aspire notes](https://github.com/konradcinkusz/dotNET_Aspire_Summary_Tutorial) and [Orchestrating PostgreSQL with .NET Aspire](https://github.com/konradcinkusz/dotnet-aspire-postgress-article) | A study guide with a full walkthrough of an Aspire solution (API, worker, PostgreSQL, Redis), and an article on adding an Aspire AppHost to an existing .NET 9 solution |
| [ConsoleAppAlgorithmsExamples](https://github.com/konradcinkusz/ConsoleAppAlgorithmsExamples) | A .NET console app with small algorithm exercises and their tests: cycle detection, BFS and DFS route search on a grid, a train composition |
| [Aprendo a leer, Aprendo los números, Aprendo economía](https://github.com/konradcinkusz/learning-to-read) | Daily notebooks for a child, one A4 page per working day, in Spanish with English and Polish editions: [reading](https://github.com/konradcinkusz/learning-to-read), [numbers](https://github.com/konradcinkusz/learning-to-count) and [economics](https://github.com/konradcinkusz/learning-economics); generated from data, with every activity checked by script |
| [german-from-zero-to-hero](https://github.com/konradcinkusz/german-from-zero-to-hero) | German from zero to B2 in 52 weeks, in Polish, for an engineer aiming at a job in Switzerland: 48 units with exercises and keys, grammar and vocabulary flashcards, and Anki decks |
| [read-more-books](https://github.com/konradcinkusz/read-more-books) and [sleep-12h-per-day](https://github.com/konradcinkusz/sleep-12h-per-day) | Two short Polish books in progress: how to find time to read twice as much, and how to arrange the day around twelve hours of sleep and baking bread (not medical advice) |
| [csharp-flashcards](https://github.com/konradcinkusz/csharp-flashcards) | Beamer Q&A flashcard deck covering C# from fundamentals through cloud and leadership topics - built for interview prep, classes, and self-study |
| [agents-and-llms](https://github.com/konradcinkusz/agents-and-llms) | Searchable knowledge base for the Agents & LLMs shorts series - static, search-first page covering basics, foundations, model internals, and agent tooling, with content driven entirely from JSON |
| [dev-insight](https://github.com/konradcinkusz/dev-insight) | Practical coding examples and patterns featured on the Dev Insight channel - C#, .NET, Transformers, SOLID, and more |
| [C# Dictionaries - Deep Dive](https://github.com/konradcinkusz/DeepDiveInto_CSharp_Dictionaries_presentation) | Deep dive into Dictionary internals - hashing, buckets, collisions, resizing, complexity analysis, and benchmarks |

### 🔬 Science, simulation and from-scratch implementations

| Project | Description |
| --- | --- |
| [bayesian-inference](https://github.com/konradcinkusz/bayesian-inference) | A from-scratch exact Bayesian-network inference engine (Enumeration-Ask, no probabilistic-reasoning library) in C#, wrapped in a Blazor WebAssembly and ASP.NET Core app |
| [black-hole-sim](https://github.com/konradcinkusz/black-hole-sim) | A Schwarzschild black hole raytracer in C#: numerically integrates photon geodesics via RK4 and renders a thin accretion disk, with a console renderer and an ASP.NET Core API |
| [TinyTransformer](https://github.com/konradcinkusz/tiny-transformer) | Minimal educational C# implementation of the Transformer architecture - encoder-decoder, multi-head attention, feed-forward layers, and positional encodings |
| [rsna-knee-abnormalities-efficiency-lb](https://github.com/konradcinkusz/rsna-knee-abnormalities-efficiency-lb) | Multimodal 2.5D deep learning pipeline (DINOv2 plus a multilingual text branch) for the RSNA Knee Abnormality Detection Kaggle challenge, with a weak-supervision strategy and diagnostics tooling |

### 🧮 Apps and calculators

| Project | Description |
| --- | --- |
| [IberiaFamilyCalculator](https://github.com/konradcinkusz/IberiaFamilyCalculator) | Interactive Spanish IRPF, autónomos, and payroll calculator - drag sliders, add entities, share the full setup via a single URL |
| [SupercompensationApp](https://github.com/konradcinkusz/SupercompensationApp) | The supercompensation curve - fatigue, recovery, overshoot - applied to Agile sprints, as a Blazor WebAssembly app with the model's formulas written out in the README and published live to GitHub Pages |
| [combustion-reports](https://github.com/konradcinkusz/combustion-reports) | Fuel consumption as a curve rather than the brochure's two numbers: fits consumption against average speed and route length, runs entirely in the browser with no account or server, and carries a section on how *not* to read its own charts |

---

## 🗺️ Portfolio map

This repository also hosts a data-driven portfolio map: forty-three repositories, bilingual,
with a consolidation analysis and an operating model behind them, rendered as a small
static site. See [`docs/PORTFOLIO-MAP.md`](docs/PORTFOLIO-MAP.md) for what it is, how it's
maintained and how it deploys.

---

## 💻 Tech stack

**Languages and runtime**

![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-5C2D91?style=for-the-badge&logo=dotnet&logoColor=white)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Blazor](https://img.shields.io/badge/Blazor-5C2D91?style=for-the-badge&logo=blazor&logoColor=white)
![.NET Aspire](https://img.shields.io/badge/.NET%20Aspire-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![EF Core](https://img.shields.io/badge/EF%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![SignalR](https://img.shields.io/badge/SignalR-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

**Cloud and delivery**

![Azure](https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Fly.io](https://img.shields.io/badge/Fly.io-8E4EC6?style=for-the-badge&logo=flydotio&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![Azure DevOps](https://img.shields.io/badge/Azure%20DevOps-0078D4?style=for-the-badge&logo=azuredevops&logoColor=white)

**Data and observability**

![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry&logoColor=white)

---

## 📊 GitHub activity

Mostly AI tooling, educational .NET content, and long-lived open source platforms rather than throwaway demos.

<p align="center">
  <img width="49%" src="https://github-readme-stats.vercel.app/api?username=konradcinkusz&show_icons=true&include_all_commits=true&count_private=true&theme=tokyonight&hide_border=true" alt="GitHub stats" />
  <img width="49%" src="https://nirzak-streak-stats.vercel.app/?user=konradcinkusz&theme=tokyonight&hide_border=true" alt="GitHub streak" />
</p>

---

## 👋 Follow

[![GitHub followers](https://img.shields.io/github/followers/konradcinkusz?style=social)](https://github.com/konradcinkusz?tab=followers "Follow on GitHub")
[![YouTube channel](https://img.shields.io/badge/YouTube-Dev%20Insight-red?style=social&logo=youtube)](https://www.youtube.com/@_dev_insight "Dev Insight on YouTube")
[![X](https://img.shields.io/badge/X-@dev__insight-black?style=social&logo=x)](https://x.com/dev_insight "@dev_insight on X")
