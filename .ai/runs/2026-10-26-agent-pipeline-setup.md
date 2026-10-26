# Konfiguracja pipeline’u agentowego

Date: 2026-10-26  
Status: complete

## Objective

Skonfigurować pipeline PR wymagany przez automatyczne wdrażanie specyfikacji.

## Actions

- Utworzono `.ai/agentic.config.json` dla GitHub, gałęzi `main`, testów `npm run test`, builda `npm run build` i QA dla zmian UI.
- Zainstalowano deskryptory GitHub oraz lokalnego `agent-browser`.
- Dodano ignorowane artefakty QA i katalogi konfiguracyjne pipeline’u.

## Checks

- Konfiguracja JSON i deskryptory istnieją oraz mają oczekiwane ustawienia.
- Kontrola zależności skilli: `SKILL_COVERAGE_OK`.
- GitHub CLI nie jest uwierzytelnione: aktywny token jest nieważny; etykiety nie zostały sprawdzone ani utworzone.

## Outcome

Pipeline jest lokalnie skonfigurowany. Przed automatycznym utworzeniem PR wymagane jest ponowne uwierzytelnienie GitHub CLI.
