# 🎬 Assuna - Clip Manager (v2.0.0)

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE-MIT)
[![Tauri 2.x](https://img.shields.io/badge/Tauri-2.x-blue.svg)](https://tauri.app)
[![Rust 2024](https://img.shields.io/badge/Rust-2024%20Edition-orange.svg)](https://www.rust-lang.org)

**Assuna - Clip Manager** é uma aplicação desktop nativa desenvolvida com **Tauri 2.x**, **Rust** e **HTML5/Vanilla CSS/JS** projetada para streamers organizarem sua biblioteca de clipes da Twitch, acompanharem métricas de desempenho no YouTube Shorts e gerenciarem estatísticas de partidas do Valorant (Riot Games).

---

## ✨ Principais Funcionalidades

- **🟣 Importação Automática da Twitch:** Conexão OAuth2 Client Credentials com a Twitch Helix API para buscar clipes automaticamente com miniaturas e datas.
- **▶️ Players de Vídeo Integrados:** Reproduza seus clipes da Twitch (16:9) e previews do YouTube Shorts (9:16) diretamente na aplicação sem precisar abrir o navegador.
- **📚 Biblioteca Interativa & Ações Rápidas:** Busca em tempo real, filtros por status (*Novo, Editando, Editado, Postado, Descartado*), categorias personalizadas, exclusão rápida no card, exclusão em massa e visualização em Grade ou Tabela.
- **🔴 Métricas Consolidadas do YouTube:** Acompanhe visualizações, curtidas e comentários de Shorts via YouTube Data API v3 com sincronização periódica.
- **🎮 Vínculo de Partidas do Valorant (Henrik API):** Associe partidas competitivas a cada clipe com exibição detalhada de Mapa, Agente, KDA, Placar e badge de Vitória/Derrota.
- **📊 Dashboard de Analytics Avançado:**
  - Métricas de visualização comparativas (Twitch Views vs YouTube Shorts Views).
  - Pipeline de produção visual com distribuição por status.
  - **Somatória de Estatísticas do Valorant:** Cálculo automático da Taxa de Vitória (Win Rate %), K/D Ratio, Abates Totais (Kills), Mortes (Deaths), Assistências (Assists) e Agente Favorito de todos os clipes vinculados.
- **🤖 Promoção Automática de Status:** Ao adicionar o link de um YouTube Short em um clipe, ele é automaticamente promovido para o status *Postado*.
- **💾 Backup & Exportação:** Exportação/Importação completa em JSON e relatórios tabulares em formato CSV.
- **🔒 Privativo & Local First:** Armazenamento local via SQLite (`rusqlite` com WAL mode) mantendo 100% dos dados na sua máquina.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Rust (Edition 2024), SQLite bundled com WAL mode, Reqwest HTTP, Tokio, Serde, Chrono.
- **Frontend:** HTML5 Semântico, Vanilla CSS (Dark Mode Design System inspirado no Spotify e Linear), Vanilla JavaScript ES6+.
- **Desktop Framework:** Tauri 2.x (Bridge IPC com comandos customizados).
- **Gráficos:** Chart.js 4.4 (Bundle local offline).
- **Gerenciador de Pacotes:** `pnpm`.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org) (v18+) e [pnpm](https://pnpm.io)
- [Rust & Cargo](https://rustup.rs) (Edition 2024)
- Dependências de sistema do Tauri 2.x para Linux/Windows

### 1. Clonar o repositório
```bash
git clone https://github.com/pedrozaz/clipmanager.git
cd clipmanager
```

### 2. Instalar dependências e rodar em desenvolvimento
```bash
pnpm install
pnpm tauri dev
```

*Nota para Linux (Wayland):* Se ocorrer erro de protocolo GDK/Wayland, execute com o fallback XWayland:
```bash
GDK_BACKEND=x11 pnpm tauri dev
```

### 3. Rodar a suíte de testes unitários e de integração
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### 4. Gerar o executável de produção
```bash
pnpm tauri build
```

---

## 📖 Documentação do Usuário

Para conferir o guia de uso detalhado para configurar as chaves da Twitch, YouTube e Valorant, consulte:
- [📖 Guia do Usuário (`docs/user-guide.md`)](docs/user-guide.md)

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
