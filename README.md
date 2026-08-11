# 🎬 ClipManager — Organizador de Clipes & Analytics para Streamers

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE-MIT)
[![Tauri 2.x](https://img.shields.io/badge/Tauri-2.x-blue.svg)](https://tauri.app)
[![Rust 2024](https://img.shields.io/badge/Rust-2024%20Edition-orange.svg)](https://www.rust-lang.org)

**ClipManager** é uma aplicação desktop nativa desenvolvida com **Tauri 2.x**, **Rust** e **HTML5/Vanilla CSS/JS** projetada para streamers organizarem sua biblioteca de clipes da Twitch, acompanharem métricas de desempenho no YouTube e vincularem estatísticas de partidas do Valorant (Riot Games).

---

## ✨ Principais Funcionalidades

- **🟣 Importação Automática da Twitch:** Conexão OAuth2 Client Credentials com a Twitch Helix API para buscar clipes automaticamente.
- **📚 Biblioteca Interativa:** Busca em tempo real, filtros por status (*Novo, Editando, Editado, Postado, Descartado*), categorias personalizadas e visualização em Grade ou Tabela.
- **🔴 Analytics do YouTube:** Coleta automática de visualizações, curtidas e comentários via YouTube Data API v3.
- **🎮 Integração com Valorant (Henrik API):** Vínculo inteligente de dados da partida (Agente, KDA, Mapa, Placar e Vitória/Derrota) com cada clipe de jogada.
- **📊 Dashboard de Analytics (Offline):** Gráficos interativos renderizados via Chart.js local com métricas agregadas e rankings.
- **💾 Backup & Exportação:** Exportação/Importação completa em JSON e relatórios tabulares em formato CSV.
- **🔒 Privativo & Local First:** Armazenamento local leve via SQLite (`rusqlite` WAL mode) com 0 dependências externas de nuvem.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Rust (Edition 2024), SQLite bundled com WAL mode, Reqwest HTTP, Tokio, Serde, Chrono.
- **Frontend:** HTML5 Semântico, Vanilla CSS (Dark Mode Design System com tokens customizados), Vanilla JavaScript ES6+ em módulos.
- **Desktop Framework:** Tauri 2.x (Bridge IPC via `window.__TAURI__.core.invoke`).
- **Gráficos:** Chart.js 4.4 (Bundle local offline).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org) (v18+)
- [Rust & Cargo](https://rustup.rs) (Edition 2024)
- Dependências de sistema do Tauri 2.x para Linux/Windows

### 1. Clonar o repositório
```bash
git clone https://github.com/user/clipmanager.git
cd clipmanager
```

### 2. Instalar dependências e rodar em desenvolvimento
```bash
npm install
npm run tauri dev
```

### 3. Rodar a suíte de testes unitários e de integração
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### 4. Gerar o executável de produção
```bash
npm run tauri build
```

---

## 📖 Documentação do Usuário

Para conferir o passo a passo completo sem termos técnicos para configurar as APIs da Twitch, YouTube e Valorant, consulte o arquivo:
- [📖 Guia do Usuário (`docs/user-guide.md`)](docs/user-guide.md)

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE-MIT).
