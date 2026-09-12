<h1 align="center">Hi 👋, I'm Konrad</h1>
<h3 align="center">Backend engineer building .NET systems, AI tools, and developer infrastructure</h3>

<br/>

<p align="center">
  <a href="https://www.youtube.com/@_dev_insight">▶️ Dev Insight</a>
  &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;
  <a href="https://x.com/dev_insight">🐦 @dev_insight</a>
</p>

<br/>

I'm a software engineer with **10 years of commercial experience** across e-commerce, energy, and enterprise domains. My core stack is **.NET, C#, Azure, and microservices** - building distributed systems that handle real load on real infrastructure.

When I build something useful and repeatable, I open-source it. Right now that means **AI observability platforms**, **multi-agent developer tooling**, and educational .NET content.

I also run **[Dev Insight](https://www.youtube.com/@_dev_insight)** — a channel covering C#, .NET, and system design through deep dives, flashcards, and live coding.

---

## 🛠️ Open source projects

Below are the open source projects I actively maintain, focused on AI tooling, developer
experience, and educational .NET content.

| Project | Description |
| --- | --- |
| [architecture-standards](https://github.com/konradcinkusz/architecture-standards) | An architecture constitution for .NET Aspire on Fly.io and Azure - 15 principles and 17 operational guides, readable as documentation and installable as agent plugins for Claude Code, Copilot and VS Code |
| [architecture-standards-init-example](https://github.com/konradcinkusz/architecture-standards-init-example) | What that constitution produces when pointed at an empty repository - one Aspire composition root, a 477-line shared kernel with the ceiling enforced in CI, a Next.js surface reading config per request, three Fly apps and eight workflows, and deliberately no domain model |
| [agent-eval-bench](https://github.com/konradcinkusz/agent-eval-bench) | A spec-first evaluation bench for tool-using agents: 35 YAML scenarios, 313 assertions over the execution trace, a deterministic layer that gates every pull request, and a rubric judge that reports `skipped` rather than green without credentials |
| [listing-search-bench](https://github.com/konradcinkusz/listing-search-bench) | The same evaluation method applied to a hybrid search ranker: a contract written before the pipeline, 28 scenarios and 128 assertions over the execution trace - 22% of them asserting absence - plus a mutation pass that proves the suite can fail |
| [CopilotScope](https://github.com/konradcinkusz/copilot-scope) | AI coding-session observability - an OTLP collector with a hand-written protobuf decoder, a Postgres store, and a Blazor dashboard that scores session quality rather than token spend, across five assistants |
| [claude-scope](https://github.com/konradcinkusz/claude-scope) | Session forensics for coding agents - a `/session-report` skill that turns a session's own transcript into token, timing and conversation-shape analytics with a visual timeline; the script does every calculation and the model never does arithmetic |
| [AgentHelm](https://github.com/konradcinkusz/AgentHelm) | Web cockpit for AI coding agents - drive GitHub Copilot CLI, Claude Code, and Gemini via the Agent Client Protocol with permission policies, audit trail, and git diff review |
| [authservice](https://github.com/konradcinkusz/authservice) | Standalone auth microservice for ASP.NET Core: JWT with rotating refresh tokens and reuse detection, RS256 with published JWKS, Google/GitHub OAuth with provider-side email verification, multi-tenant organizations, and an append-only audit log |
| [parcel-number-generator](https://github.com/konradcinkusz/parcel-number-generator) | A warehousing system modernized from a 2018 .NET Framework solution: a finite parcel-number pool with exclusions and three allocation strategies, a notification service absorbed from a second repository, an operator console, and CI that fails a model drifted from its migrations |
| [MAF for .NET Engineers](https://github.com/konradcinkusz/maf-book) | Practitioner's guide to Microsoft Agent Framework 1.0 for .NET - agents, tools, MCP, graph-based workflows, multi-agent orchestration, middleware, and hosting, with samples that run against a local model |
| [LangChain, LangGraph and Async Python](https://github.com/konradcinkusz/llm-book) | Practitioner's guide to LangChain 1.x and LangGraph for engineers arriving from .NET - async Python, cancellation, persistence, interrupts, context engineering, and five specified measurement experiments |
| [csharp-flashcards](https://github.com/konradcinkusz/csharp-flashcards) | Beamer Q&A flashcard deck covering C# from fundamentals through cloud and leadership topics - built for interview prep, classes, and self-study |
| [agents-and-llms](https://github.com/konradcinkusz/agents-and-llms) | Searchable knowledge base for the Agents & LLMs shorts series - static, search-first page covering basics, foundations, model internals, and agent tooling, with content driven entirely from JSON |
| [bayesian-inference](https://github.com/konradcinkusz/bayesian-inference) | A from-scratch exact Bayesian-network inference engine (Enumeration-Ask, no probabilistic-reasoning library) in C#, wrapped in a Blazor WebAssembly and ASP.NET Core app |
| [black-hole-sim](https://github.com/konradcinkusz/black-hole-sim) | A Schwarzschild black hole raytracer in C#: numerically integrates photon geodesics via RK4 and renders a thin accretion disk, with a console renderer and an ASP.NET Core API |
| [TinyTransformer](https://github.com/konradcinkusz/tiny-transformer) | Minimal educational C# implementation of the Transformer architecture - encoder-decoder, multi-head attention, feed-forward layers, and positional encodings |
| [llm-multi-agent-chess](https://github.com/konradcinkusz/llm-multi-agent-chess) | Two LLM-powered chess agents battle through a Streamlit interface with configurable personalities and real-time board visualisation |
| [chess-mas](https://github.com/konradcinkusz/chess-mas) | Multi-agent chess in C#, orchestrated with .NET Aspire and Microsoft Agent Framework, with cost tracking against Azure AI Foundry |
| [IberiaFamilyCalculator](https://github.com/konradcinkusz/IberiaFamilyCalculator) | Interactive Spanish IRPF, autónomos, and payroll calculator - drag sliders, add entities, share the full setup via a single URL |
| [SupercompensationApp](https://github.com/konradcinkusz/SupercompensationApp) | The supercompensation curve - fatigue, recovery, overshoot - applied to Agile sprints, as a Blazor WebAssembly app with the model's formulas written out in the README and published live to GitHub Pages |
| [combustion-reports](https://github.com/konradcinkusz/combustion-reports) | Fuel consumption as a curve rather than the brochure's two numbers: fits consumption against average speed and route length, runs entirely in the browser with no account or server, and carries a section on how *not* to read its own charts |
| [dev-insight](https://github.com/konradcinkusz/dev-insight) | Practical coding examples and patterns featured on the Dev Insight channel - C#, .NET, Transformers, SOLID, and more |
| [C# Dictionaries - Deep Dive](https://github.com/konradcinkusz/DeepDiveInto_CSharp_Dictionaries_presentation) | Deep dive into Dictionary internals - hashing, buckets, collisions, resizing, complexity analysis, and benchmarks |

---

## 🗺️ Portfolio map

This repository also hosts a data-driven portfolio map: forty-three repositories, bilingual,
with a consolidation analysis and an operating model behind them, rendered as a small
static site. See [`docs/PORTFOLIO-MAP.md`](docs/PORTFOLIO-MAP.md) for what it is, how it's
maintained and how it deploys.

---

## 💻 Tech Stack
![C#](https://img.shields.io/badge/c%23-%23239120.svg?style=for-the-badge&logo=csharp&logoColor=white)
![.Net](https://img.shields.io/badge/.NET-5C2D91?style=for-the-badge&logo=.net&logoColor=white)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-512BD4?style=for-the-badge)
![Blazor](https://img.shields.io/badge/blazor-%235C2D91.svg?style=for-the-badge&logo=blazor&logoColor=white)
![.NET Aspire](https://img.shields.io/badge/.NET%20Aspire-512BD4?style=for-the-badge)
![EF Core](https://img.shields.io/badge/EF%20Core-512BD4?style=for-the-badge)
![Azure](https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![MicrosoftSQLServer](https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoft%20sql%20server&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
![Azure DevOps](https://img.shields.io/badge/azure%20devops-0078D4.svg?style=for-the-badge&logo=microsoftazure&logoColor=white)
![SignalR](https://img.shields.io/badge/SignalR-512BD4?style=for-the-badge)

## 📊 GitHub Activity
Mostly AI tooling, educational .NET content, and long-lived open source platforms rather than throwaway demos.

![](https://github-readme-stats.vercel.app/api?username=konradcinkusz&theme=dark&hide_border=false&include_all_commits=true&count_private=true)
![](https://nirzak-streak-stats.vercel.app/?user=konradcinkusz&theme=dark&hide_border=false)
