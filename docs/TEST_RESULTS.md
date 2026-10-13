## Baseline Test Run (Current Iteration: Post CF-002)

- **Date**: 2026-10-13 22:11:39 IST
- **Environment**: Python 3.14.7 (Windows x64), SQLite In-Memory, uv venv
- **Command**: `uv run pytest tests/ -v`

### Results Summary
- **Total Tests Collected**: 84
- **Passed**: 52
- **Failed**: 0
- **Skipped**: 32 (External Pinecone vector DB & Google Gemini cloud credentials skipped cleanly via `pytest.skip`)
- **Duration**: 10.69 seconds

### Passed Test Suites Breakdown
1. `tests/test_api.py` (4 passed): Login, protected profile auth, unauthorized rejection.
2. `tests/test_checkpoint_persistence.py` (4 passed): Thread resumption, conversational memory continuity, thread isolation, checkpointer reboot survival.
3. `tests/test_end_to_end_scenario.py` (1 passed): Full scenario lifecycle from user question to alternative suggestion.
4. `tests/test_multi_goal_waterfall.py` (5 passed): Priority waterfall hierarchy, surplus deficit starvation, loan payoff recovery, empty goals handling, and API schema integration.
5. `tests/test_profile_crud.py` (4 passed): Profile retrieval with KPIs, expense updates, asset CRUD with user isolation, liability & goal CRUD.
5. `tests/test_scenario_agent.py` (5 passed): Parameter extraction, unit parsing (lakh/crore), tool authorization rejection, missing parameter clarification journey.
6. `tests/test_scenario_api.py` (5 passed): Scenario simulation endpoints, input validation, idempotency, cross-user isolation.
7. `tests/test_scenario_confirmation.py` (1 passed): Full scenario intent clarification and liability confirmation journey.
8. `tests/test_scenario_engine.py` (6 passed): Standard amortizing loan, zero-interest loan, invalid inputs, retirement simulation baseline vs scenario, paired Monte Carlo CRN reproducibility.
9. `tests/test_scenario_security.py` (5 passed): Cross-user isolation, prompt injection resistance, credential exposure prevention, read-only guarantee post-simulation.
10. `tests/test_scenario_versioning.py` (1 passed): Scenario versioning, parent linkage, and assumption delta tracking.
11. `tests/test_supervisor.py` (3 passed): Tax tool validation, budgeting tool auth rejection.

### Frontend Baseline
- **TypeScript Typecheck**: `npx tsc --noEmit` $\rightarrow$ Exit 0 (Clean).
- **Next.js Production Build**: `npm run build` $\rightarrow$ Exit 0 (9/9 static pages generated, chunks optimized).
