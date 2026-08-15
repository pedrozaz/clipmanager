# 🎬 Assuna - Clip Manager (v3.0.1) — Guia do Usuário

Bem-vindo ao **Assuna - Clip Manager**, seu aplicativo de área de trabalho definitivo para organizar, gerenciar, visualizar e analisar seus clipes de live na Twitch, vídeos no YouTube Shorts e partidas no Valorant!

Este guia foi feito pensando em você, streamer e criador de conteúdo. Não é necessário nenhum conhecimento técnico para usar o aplicativo.

> **🐧 Usuários Linux:** Você pode preparar todo o ambiente de forma automática executando o script `./scripts/install-deps-linux.sh`.

---

## 🚀 1. Primeiro Acesso e Configuração Rápida

Ao abrir o aplicativo, acesse a aba **⚙️ Configurações** na barra lateral esquerda para conectar suas contas e chaves de API:

### 🟣 1.1 Configurar a Twitch (Importação Automática e Categorias)
1. Acesse o [Console de Desenvolvedores da Twitch](https://dev.twitch.tv/console/apps).
2. Cadastre uma nova aplicação (Nome: `Assuna - Clip Manager`, Categoria: `Application`).
3. Copie o **Client ID** e gere um **Client Secret**.
4. Insira seu nome de usuário na Twitch (ex: `assunavlr`).
5. Clique em **Salvar Credenciais Twitch** e valide em **⚡ Testar Conexão**.
> 💡 *Nota importante:* Se você clicar em "Novo Secret" na Twitch, o segredo anterior é revogado na hora. Sempre atualize o campo no app caso gere uma nova chave.

### 🔴 1.2 Configurar o YouTube (Métricas de Views, Curtidas e Comentários)
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Ative a **YouTube Data API v3** e crie uma **Chave de API (API Key)**.
3. Cole a chave de API no campo correspondente nas Configurações do app.
4. Clique em **Salvar Chave YouTube** e valide em **⚡ Testar Conexão**.

### 🎮 1.3 Configurar o Valorant (Vínculo de Partidas)
1. Informe seu **Riot ID** completo no formato `Nome#TAG` (ex: `Assuna#bmth`).
2. Selecione a sua região (ex: `Brasil (br)`).
3. Insira sua chave de API da HenrikDev (caso possua uma chave própria de desenvolvedor).
4. Clique em **Salvar Dados Valorant** e valide em **⚡ Testar Conexão**.

---

## 📚 2. Usando a Biblioteca de Clipes

Na aba **📚 Biblioteca**, você gerencia todos os seus vídeos com praticidade.

### 📥 2.1 Importar Clipes da Twitch com Auto-Categorização
- Clique no botão **🟣 Importar da Twitch** no topo da página.
- Escolha a quantidade de clipes desejada.
- O aplicativo irá buscar seus clipes com paginação completa por cursor, miniaturas oficiais e **identificará automaticamente o jogo transmitido** (ex: *VALORANT, Just Chatting*), criando as categorias coloridas correspondentes e vinculando-as aos clipes.

### ➕ 2.2 Adicionar Clipe Manualmente
- Clique no botão **➕ Novo Clipe**.
- Preencha o Título e cole a URL da Twitch (`https://clips.twitch.tv/...`) ou YouTube Shorts (`https://youtube.com/shorts/...`).
- O app busca automaticamente a miniatura oficial, métricas e categoria do jogo direto da Twitch/YouTube.

### 🔍 2.3 Busca, Filtros e Ações Rápidas
- **Busca em Tempo Real:** Digite no campo de busca para filtrar por título ou notas.
- **Filtrar por Status:** Selecione apenas clipes *Novos*, *Em Edição*, *Editados*, *Postados* ou *Descartados*.
- **Filtrar por Categoria:** Selecione a categoria ou jogo desejado no dropdown.
- **Visualização:** Alterne entre os modos **Grade (Grid)** ou **Tabela (Lista)**.
- **Exclusão Rápida:** Passe o mouse sobre qualquer card na grade para exibir o botão de exclusão rápida (X). Para apagar todo o acervo de testes, use o botão **Apagar Todos**.
- **Indicador do YouTube:** Cards com vídeo postado no Shorts ganham uma badge vermelha do YouTube no canto inferior.

---

## ✏️ 3. Detalhes, Players de Vídeo e Vínculo de Partidas

Clique em qualquer card de clipe para abrir a tela de **Detalhes**:

### ▶️ 3.1 Players de Vídeo Integrados (HTTPS Nativo)
- **Twitch (16:9):** Assista ao clipe original da Twitch diretamente na tela do aplicativo, totalmente compatível com as regras de segurança HTTPS de embeds do WebView2 no Windows e Linux.
- **YouTube Shorts (9:16):** Visualize o preview do vídeo na proporção vertical oficial do Shorts.

### 📝 3.2 Gerenciamento do Clipe
- **Status & Autopromoção:** Alterne o status manualmente. Ao adicionar o link de um YouTube Short (`https://youtube.com/shorts/...`), o aplicativo altera automaticamente o status do clipe para **Postado**.
- **Anotações Auto-Salvas:** Digite ideias de edição, legendas ou hashtags. O app salva automaticamente conforme você digita.
- **Categorias e Tags:** Adicione ou remova tags personalizadas para organizar seu conteúdo (ex: *Highlight*, *Fail*, *Clutch*).

### 📊 3.3 Métricas Consolidadas
- Visualize o **Total Acumulado de Views** (Twitch + YouTube Shorts).
- Clique em **🔄 Sincronizar YouTube** para atualizar as contagens de visualizações, curtidas e comentários em tempo real.

### 🎮 3.4 Vinculando Partidas do Valorant
- Clique em **Vincular Partida Recente**.
- O app lista as suas **últimas 20 partidas competitivas** com Mapa, Agente, KDA, Placar e resultado de Vitória/Derrota.
- Clique sobre a partida desejada para vinculá-la ao clipe. As estatísticas da partida ficarão salvas na barra lateral.

---

## 📊 4. Dashboard de Analytics

Na aba **📊 Dashboard**, você tem acesso ao pipeline completo de produção e métricas de desempenho:

- **6 KPIs Principais:** Total de Clipes, Views da Twitch, Views do Shorts, Clipes Postados, Em Edição e Aguardando Edição.
- **Ranking de Populares:** Lista dos clipes mais vistos na Twitch e dos Shorts com mais visualizações e curtidas no YouTube.
- **Gráfico de Status:** Distribuição em rosca mostrando a quantidade de clipes em cada etapa da edição.
- **Desempenho no Valorant (Somatória de Clipes):**
  - **Taxa de Vitória (Win Rate %):** Porcentagem de vitórias e contagem total de `V / D`.
  - **K/D Ratio:** Razão de abates/mortes somados de todos os clipes vinculados.
  - **Estatísticas Agregadas:** Abates Totais (Kills), Mortes Totais (Deaths), Assistências Totais e Agente Favorito.

---

## 🎨 5. Gerenciamento de Categorias com Seletor de Cores

Na aba **⚙️ Configurações**:
- Visualize todas as categorias criadas pelo sistema ou automaticamente pela Twitch.
- Crie novas categorias escolhendo a cor visual através do **Seletor de Cores Nativo (Color Picker)**.
- Edite o nome ou a cor de categorias existentes a qualquer momento.

---

## 🔄 6. Atualizações Automáticas (Auto-Updater)

Na aba **⚙️ Configurações**:
- O card de **Atualizações do Aplicativo** exibe a versão instalada.
- Clique em **Verificar Atualização** para buscar novos releases oficiais no GitHub.
- Se houver uma nova versão disponível, um botão de download direto da nova versão será disponibilizado automaticamente.

---

## 💾 7. Backup e Exportação

Na aba **⚙️ Configurações**:
- **📥 Exportar Backup JSON:** Gera um arquivo `.json` completo contendo todos os clipes, estatísticas e categorias.
- **📊 Exportar Clipes (CSV):** Exporta uma planilha compatível com Excel e Google Sheets.
- **📤 Importar Backup JSON:** Restaura seu banco de dados a partir de um backup anterior.

---

## 💡 Suporte e Privacidade

O **Assuna - Clip Manager** opera sob a filosofia *Local-First*: todos os seus dados e credenciais permanecem armazenados localmente na sua máquina de maneira privativa e segura no banco de dados SQLite.
