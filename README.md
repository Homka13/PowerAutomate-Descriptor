# Power Automate Visualizer

An interactive visualizer and documentation generator for **Microsoft Power Automate** flow exports (`.zip` / `.json`).

![Power Automate Visualizer](https://img.shields.io/badge/Platform-Windows%20Portable-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![Electron](https://img.shields.io/badge/Electron-29-47848f)

---

## ✨ Features

- 📊 **Flow Diagrams**: Render Power Automate flows as interactive Mermaid diagrams.
- 📑 **Documentation Generator**: Generate clean Markdown documentation for your flows with step-by-step breakdowns.
- 📦 **Zip & JSON Parsing**: Import exported `.zip` packages or direct `definition.json` flow files.
- 🚀 **Portable EXE**: Standalone desktop app for Windows — no installation required.

---

## 🚀 Quick Start (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/Homka13/PowerAutomate-Descriptor.git
   cd PowerAutomate-Descriptor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🛠️ Building Portable EXE

To build the standalone Windows `.exe` file without installing:

```bash
npm run dist
```

The output executable will be created in `dist_electron/Power Automate Visualizer-Portable.exe`.

---

## 📦 Automatic Build & Release Script

You can automatically build and publish a new GitHub Release with the attached `.exe` binary by running the PowerShell script:

```powershell
.\build-and-release.ps1
```

Or specify a custom version tag:

```powershell
.\build-and-release.ps1 -Tag "v1.0.1"
```

---

## 📜 License

[Apache License 2.0](LICENSE)
