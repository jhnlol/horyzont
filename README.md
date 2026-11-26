<p align="center">
  <img src="resources/linux/code.png" width="112" alt="Logo Horyzont">
</p>

<h1 align="center">Horyzont</h1>

<p align="center">
  <b>Spokojny edytor kodu oparty na Code - OSS (Visual Studio Code).</b><br>
  Mniej rozpraszaczy, lepsze domyślne ustawienia, zero telemetrii.
</p>

<p align="center">
  <a href="https://github.com/jhnlol/horyzont/releases/latest"><img src="https://img.shields.io/github/v/release/jhnlol/horyzont?label=wydanie&color=8b5cf6" alt="Najnowsze wydanie"></a>
  <a href="https://github.com/jhnlol/horyzont/actions/workflows/release.yml"><img src="https://img.shields.io/github/actions/workflow/status/jhnlol/horyzont/release.yml?label=build" alt="Status builda"></a>
  <a href="LICENSE.txt"><img src="https://img.shields.io/badge/licencja-MIT-f59e0b" alt="Licencja MIT"></a>
</p>

<p align="center">
  <a href="https://github.com/jhnlol/horyzont/releases/latest"><b>⬇ Pobierz najnowszą wersję</b></a>
  &nbsp;·&nbsp;
  <a href="HORYZONT.md">Dokumentacja zmian</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/jhnlol/horyzont/issues">Zgłoś problem</a>
</p>

---

Horyzont to fork VS Code, który zachowuje wszystko, co znasz (rozszerzenia, skróty, ustawienia, terminal, debugger), ale dodaje kilka narzędzi do skupienia i porządkuje domyślne ustawienia. Twoje dotychczasowe rozszerzenia znajdziesz w [Open VSX](https://open-vsx.org).

## Funkcje

| | |
|---|---|
| 🎯 **Horyzont Focus** (`Ctrl+K .`) | Przygasza kod poza funkcją lub klasą, w której pracujesz, chowa panele boczne i wycisza powiadomienia. Ten sam skrót wyłącza tryb. |
| 🕯️ **Ślady edycji** | Przy numerach linii widać, gdzie ostatnio pisałeś. Ślad blednie z czasem (1 min → 12 h). |
| 🌿 **Kontekst per gałąź git** | Po `git checkout` wracają karty, układ edytorów, breakpointy i panele z tej gałęzi. Niezapisanych kart nigdy nie zamyka. |
| 🎨 **8 wbudowanych motywów** | Night, Dawn, Abyss (OLED), Ember, Moss, Fjord, Paper i Mist. Domyślnie przełączają się razem z motywem systemu. |
| 🔒 **Prywatność** | Telemetria wyłączona, bez eksperymentów online, rozszerzenia z Open VSX. |
| ⚡ **Rozsądne domyślne** | Ligatury, płynny kursor i przewijanie, sticky scroll, autozapis, inlay hints, bez minimapy, limit otwartych kart. |
| 🔄 **Automatyczne aktualizacje** | Prosto z GitHub Releases. |

Każdą funkcję można wyłączyć w ustawieniach (szukaj `horyzont.`).

## Instalacja

Pobierz plik dla swojego systemu z [najnowszego wydania](https://github.com/jhnlol/horyzont/releases/latest):

| System | Plik | Uwagi |
|---|---|---|
| **Windows** (x64) | `HoryzontUserSetup-x64-<wersja>.exe` | Instalacja bez uprawnień administratora, aktualizuje się sam. |
| **Linux** (x64) | `Horyzont-linux-x64-<wersja>.tar.gz` | Rozpakuj i uruchom `bin/horyzont`. |
| **macOS** (Apple Silicon) | `Horyzont-darwin-arm64-<wersja>.zip` | Rozpakuj i przenieś do *Aplikacji*. |

### Pierwsze uruchomienie

Wydania nie mają płatnego podpisu cyfrowego, więc system może ostrzec przy pierwszym otwarciu:

- **Windows:** w oknie SmartScreen kliknij *Więcej informacji* → *Uruchom mimo to*.
- **macOS:** kliknij aplikację prawym przyciskiem myszy → *Otwórz* → *Otwórz*.

## Przejście z VS Code

- Ustawienia i skróty: skopiuj `settings.json` i `keybindings.json` z folderu użytkownika VS Code do folderu użytkownika Horyzontu (*Plik → Preferencje → Ustawienia → Otwórz ustawienia (JSON)*).
- Rozszerzenia: zainstaluj je z widoku rozszerzeń (`Ctrl+Shift+X`), który korzysta z Open VSX. Rozszerzenia Microsoftu dostępne tylko w Visual Studio Marketplace (np. Remote, Pylance, C# Dev Kit) nie są dostępne.
- Ustawienia, rozszerzenia (`~/.horyzont`) i dane Horyzontu są oddzielone od VS Code, więc oba edytory mogą działać obok siebie.

## Budowanie ze źródeł

Wymagania: Node.js 24 (`.nvmrc`), Python 3, a na Windows Visual Studio z obciążeniem C++.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm run compile-client
node build/lib/electron.ts
.\scripts\code.bat
```

Pełna instrukcja (w tym wariant bez bibliotek Spectre), opis wszystkich zmian względem VS Code oraz proces wydań: **[HORYZONT.md](HORYZONT.md)**.

## Wydania

Nowe wydanie buduje GitHub Actions po wypchnięciu tagu:

```powershell
git tag v1.0.4
git push origin v1.0.4
```

Workflow [`release.yml`](.github/workflows/release.yml) buduje Windows, Linux i macOS i publikuje GitHub Release razem z plikami aktualizacji.

## Licencja

MIT, tak jak [Code - OSS](https://github.com/microsoft/vscode). Zobacz [LICENSE.txt](LICENSE.txt).

Horyzont jest niezależnym projektem i nie jest powiązany z Microsoftem. Visual Studio Code jest znakiem towarowym Microsoft Corporation.
