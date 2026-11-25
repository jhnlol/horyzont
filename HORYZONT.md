# Horyzont

Fork Visual Studio Code (Code - OSS 1.147.0) z odświeżonym UI i domyślnymi ustawieniami na 2026.

## Co zmienione względem VS Code

| Obszar | Zmiana | Plik |
|---|---|---|
| Marka | Nazwa, ID aplikacji, foldery danych, protokół `horyzont://` | `product.json` |
| Rozszerzenia | Marketplace Open VSX (legalny dla forków) | `product.json` |
| Motywy | **Horyzont Night** (ciemny) i **Horyzont Dawn** (jasny): fiolet + bursztyn | `extensions/theme-defaults/themes/horyzont-*.json` (generator: `build/horyzont/mktheme.cjs`) |
| Domyślny motyw | Horyzont Night / Horyzont Dawn, auto-przełączanie wg systemu | `src/vs/workbench/services/themes/common/workbenchThemeService.ts` |
| UI | Zaokrąglone, „pływające” palety i menu, cienie, pigułka command center, płynne animacje (szanuje reduced-motion) | `src/vs/workbench/browser/media/horyzont.css` |
| Ustawienia 2026 | Ligatury, płynny kursor i scroll, sticky scroll, bez minimapy, autozapis, inlay hints, telemetria wyłączona | `extensions/horyzont-defaults/package.json` |
| Wydajność | Bez eksperymentów online, limit 12 kart (bez niezapisanych), bez symlinków w wyszukiwaniu, watcher pomija `.venv`, `target`, `.next`, `.gradle`, `__pycache__` | `extensions/horyzont-defaults/package.json` |
| Motywy dodatkowe | **Abyss** (OLED), **Ember**, **Moss**, **Fjord**, **Paper** (jasny, sepia), **Mist** (jasny, chłodny) | `build/horyzont/mktheme.cjs` |
| Horyzont Focus | `Ctrl+K .` przygasza kod poza bieżącą funkcją/klasą (z symboli dokumentu, w plikach bez symboli: bieżący akapit), chowa paski boczne i wycisza powiadomienia | `src/vs/workbench/contrib/horyzont/browser/horyzontFocus.ts` |
| Ślady edycji | Bursztynowy pasek przy numerze linii dla niedawno zmienionych linii; blednie w 5 krokach (1 min, 10 min, 1 h, 4 h, 12 h). Tylko w bieżącej sesji | `src/vs/workbench/contrib/horyzont/browser/horyzontEditTraces.ts` |
| Kontekst gałęzi | Przy zmianie gałęzi git zapisuje karty, układ grup, breakpointy i widoczność paneli starej gałęzi i przywraca te z nowej. Niezapisanych kart nigdy nie zamyka. Polecenie „Horyzont: Forget Saved Branch Contexts” czyści zapis | `src/vs/workbench/contrib/horyzont/browser/horyzontBranchContext.ts` |

Ustawienia nowych funkcji: `horyzont.focus.hideSideBars`, `horyzont.focus.silenceNotifications`, `horyzont.editTraces.enabled`, `horyzont.branchContext.enabled`, `horyzont.branchContext.breakpoints`. Kolor śladów: `horyzont.editTrace` w `workbench.colorCustomizations`.

Tryb Zen ma domyślny skrót `Ctrl+K Z`. Wcześniejszy `Ctrl+Alt+Z` usunięto, bo na polskiej klawiaturze to AltGr+Z, czyli „ż”.

## Wymagania (Windows)

- Node.js 24 (z `.nvmrc`; przy starszym patchu ustaw `VSCODE_SKIP_NODE_VERSION_CHECK=1`)
- Visual Studio 2026 z obciążeniem C++ **oraz** komponentem „MSVC Spectre-mitigated libs (x64/x86)”
- Python 3

## Budowanie i uruchomienie (wersja developerska)

Bez komponentu Spectre w Visual Studio użyj `build/horyzont/no-spectre.props` (tylko do dev):

```powershell
$env:VSCODE_SKIP_NODE_VERSION_CHECK='1'
$env:ForceImportAfterCppTargets="$PWD\build\horyzont\no-spectre.props"
corepack pnpm install --frozen-lockfile
corepack pnpm run compile-client
node build/lib/electron.ts
$env:VSCODE_SKIP_PRELAUNCH='1'; .\scripts\code.bat
```

Pierwsze uruchomienie trwa kilkanaście sekund, zanim wczytają się wbudowane rozszerzenia (motywy, języki).

## Wydania i automatyczne aktualizacje

Wydania buduje GitHub Actions ([`.github/workflows/release.yml`](.github/workflows/release.yml)) na Windows (x64), Linux (x64) i macOS (Apple Silicon) i publikuje je jako GitHub Release.

Nowe wydanie:

```powershell
git tag v1.1.0
git push origin v1.1.0
```

albo w zakładce **Actions → Release → Run workflow** (wersja opcjonalna). Build trwa około 1–2 godzin.

Jak działają aktualizacje:

- `product.json` ma `updateUrl` wskazujący na `https://github.com/jhnlol/horyzont/releases/latest/download` i `staticUpdateFeed: true`.
- Każde wydanie zawiera pliki `update-<platforma>-stable.json` z adresem paczki, commitem i sumą SHA-256. Zainstalowany Horyzont co kilka godzin pobiera plik ze swojego systemu z najnowszego wydania i pomija go, jeśli opisuje build, który już działa (`skipKnownBuild` w `src/vs/platform/update/electron-main/abstractUpdateService.ts`).
- **Windows:** pobiera instalator w tle, sprawdza sumę SHA-256 i instaluje po restarcie, tak jak VS Code.
- **Linux i macOS:** pokazuje powiadomienie o nowej wersji i otwiera stronę wydania. Ciche aktualizacje na macOS wymagają podpisu Apple Developer ID (płatne konto), a bez niego Squirrel.Mac odrzuca paczkę.
- **macOS:** aplikacja ma tylko podpis ad-hoc, więc za pierwszym razem trzeba ją otworzyć prawym przyciskiem myszy → Otwórz.
- Aktualizacje wyłącza ustawienie `update.mode: none`. Działają tylko w zbudowanej aplikacji, a nie w wersji uruchamianej ze źródeł.

## Wygląd

- Logo (wschodzące słońce nad horyzontem): `src/vs/workbench/browser/media/code-icon.svg`, znak wodny: `src/vs/workbench/browser/parts/editor/media/letterpress-*.svg`. Ikony aplikacji (`.ico`, `.png`, `.icns`) generuje `node build/horyzont/mkappicon.mjs 9333` przy uruchomionym oknie z `--remote-debugging-port=9333`.
- Zorza w tle, gradientowe przyciski, wskaźniki: `src/vs/workbench/browser/media/horyzont.css`
- Podgląd na żywo: uruchom z `--remote-debugging-port=9333`, potem `node build/horyzont/cdp-shot.mjs 9333 shot.png`

Po zmianie palet edytuj `build/horyzont/mktheme.cjs` i uruchom `node build/horyzont/mktheme.cjs`.
