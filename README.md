<h1 align="center">Hi 👋, I'm Konrad</h1>
<h3 align="center">Backend engineer building .NET systems, AI tools, and developer infrastructure</h3>

<p align="center">
  <a href="https://www.youtube.com/@_dev_insight" title="Dev Insight on YouTube">▶️ Dev Insight</a>
  &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
  <a href="https://x.com/dev_insight" title="@dev_insight on X">🐦 @dev_insight</a>
  &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
  <a href="https://konradcinkusz.github.io" title="Personal website">🌐 konradcinkusz.github.io</a>
</p>

<br/>

I'm a software engineer with **10 years of commercial experience** across e-commerce, energy, and enterprise domains. My core stack is **.NET, C#, Azure, and microservices** - building distributed systems that handle real load on real infrastructure.

When I build something useful and repeatable, I open-source it. Right now that means **AI observability platforms**, **evaluation benches and tooling for coding agents**, and **books and flashcards for .NET engineers**.

I also run **[Dev Insight](https://www.youtube.com/@_dev_insight)** - a channel covering C#, .NET, and system design through deep dives, flashcards, and live coding.

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
</table>

---

## 🛠️ Open source projects

The open source projects I actively maintain, grouped by what they are for.

### 🤖 AI tooling and agent engineering

| Project | Description |
| --- | --- |
| [agent-eval-bench](https://github.com/konradcinkusz/agent-eval-bench) | A spec-first evaluation bench for tool-using agents: 35 YAML scenarios, 313 assertions over the execution trace, a deterministic layer that gates every pull request, and a rubric judge that reports `skipped` rather than green without credentials |
| [listing-search-bench](https://github.com/konradcinkusz/listing-search-bench) | The same evaluation method applied to a hybrid search ranker: a contract written before the pipeline, 28 scenarios and 128 assertions over the execution trace - 22% of them asserting absence - plus a mutation pass that proves the suite can fail |
| [judge-worker](https://github.com/konradcinkusz/judge-worker) | LLM-as-a-judge post-processing worker: Redis/BullMQ batching, mutation-tested judge reliability, and human-calibrated scoring |
| [CopilotScope](https://github.com/konradcinkusz/copilot-scope) | AI coding-session observability - an OTLP collector with a hand-written protobuf decoder, a Postgres store, and a Blazor dashboard that scores session quality rather than token spend, across five assistants |
| [claude-scope](https://github.com/konradcinkusz/claude-scope) | Session forensics for coding agents - a `/session-report` skill that turns a session's own transcript into token, timing and conversation-shape analytics with a visual timeline; the script does every calculation and the model never does arithmetic |
| [AgentHelm](https://github.com/konradcinkusz/agent-helm) | Web cockpit for AI coding agents - drive GitHub Copilot CLI, Claude Code, and Gemini via the Agent Client Protocol with permission policies, audit trail, and git diff review |
| [chess-mas](https://github.com/konradcinkusz/chess-mas) | Multi-agent chess in C#, orchestrated with .NET Aspire and Microsoft Agent Framework, with cost tracking against Azure AI Foundry |
| [llm-multi-agent-chess](https://github.com/konradcinkusz/llm-multi-agent-chess) | Two LLM-powered chess agents battle through a Streamlit interface with configurable personalities and real-time board visualisation |

### 🏗️ Platform, architecture and backend

| Project | Description |
| --- | --- |
| [architecture-standards](https://github.com/konradcinkusz/architecture-standards) | An architecture constitution for .NET Aspire on Fly.io and Azure - 15 principles and 17 operational guides, readable as documentation and installable as agent plugins for Claude Code, Copilot and VS Code |
| [architecture-standards-init-example](https://github.com/konradcinkusz/architecture-standards-init-example) | What that constitution produces when pointed at an empty repository - one Aspire composition root, a 477-line shared kernel with the ceiling enforced in CI, a Next.js surface reading config per request, three Fly apps and eight workflows, and deliberately no domain model |
| [authservice](https://github.com/konradcinkusz/authservice) | Standalone auth microservice for ASP.NET Core: JWT with rotating refresh tokens and reuse detection, RS256 with published JWKS, Google/GitHub OAuth with provider-side email verification, multi-tenant organizations, and an append-only audit log |
| [parcel-number-generator](https://github.com/konradcinkusz/parcel-number-generator) | A warehousing system modernized from a 2018 .NET Framework solution: a finite parcel-number pool with exclusions and three allocation strategies, a notification service absorbed from a second repository, an operator console, and CI that fails a model drifted from its migrations |

### 📚 Books, flashcards and teaching

| Project | Description |
| --- | --- |
| [MAF for .NET Engineers](https://github.com/konradcinkusz/maf-book) | Practitioner's guide to Microsoft Agent Framework 1.0 for .NET - agents, tools, MCP, graph-based workflows, multi-agent orchestration, middleware, and hosting, with samples that run against a local model |
| [LangChain, LangGraph and Async Python](https://github.com/konradcinkusz/llm-book) | Practitioner's guide to LangChain 1.x and LangGraph for engineers arriving from .NET - async Python, cancellation, persistence, interrupts, context engineering, and five specified measurement experiments |
| [Mathematics for AI Engineers](https://github.com/konradcinkusz/math-for-ai-engineers) | From arithmetic to scaled dot-product attention in 47 programmed-learning programs; English and Polish from one source, every number computed by a script and re-checked on every build |
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

## 🎥 Dev Insight

C#, .NET and system design through deep dives, flashcards and live coding. The latest uploads:

<div align="center">

<!-- YOUTUBE:START -->
<a href="https://www.youtube.com/@_dev_insight">Latest videos on YouTube</a>
<!-- YOUTUBE:END -->

</div>

<sub>Refreshed weekly from <a href="https://www.youtube.com/@_dev_insight">youtube.com/@_dev_insight</a> by the <code>readme-videos</code> workflow.</sub>

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
