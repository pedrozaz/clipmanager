# 🎬 ClipManager — Guia do Usuário

Bem-vindo ao **ClipManager**, seu aplicativo de área de trabalho para organizar, acompanhar e impulsionar seus clipes de live na Twitch, vídeos no YouTube e jogadas incríveis no Valorant!

Este guia foi feito pensando em você, streamer e criador de conteúdo. Não é necessário nenhum conhecimento técnico para usar o aplicativo.

---

## 🚀 1. Primeiro Acesso e Configuração Rápida

Ao abrir o ClipManager, acesse a aba **⚙️ Configurações** na barra lateral esquerda para conectar suas contas e APIs:

### 🟣 1.1 Configurar a Twitch (Importação Automática)
1. Acesse o [Console de Desenvolvedores da Twitch](https://dev.twitch.tv/console/apps).
2. Cadastre uma nova aplicação (Nome: `ClipManager`, Categoria: `Application`).
3. Copie o **Client ID** e gere um **Client Secret**.
4. Insira seu nome de usuário na Twitch (ex: `streamername`).
5. Clique em **Salvar Credenciais Twitch** e depois em **⚡ Testar Conexão**.

### 🔴 1.2 Configurar o YouTube (Métricas de Views e Likes)
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Ative a **YouTube Data API v3** e crie uma **Chave de API (API Key)**.
3. Cole a chave de API no campo correspondente nas Configurações do ClipManager.
4. Clique em **Salvar Chave YouTube** e teste em **⚡ Testar Conexão**.

### 🎮 1.3 Configurar o Valorant (Vínculo de Partidas)
1. Informe seu **Riot ID** completo (ex: `Streamer#BR1`).
2. Selecione a sua região (ex: `Brasil (br)`).
3. Clique em **Salvar Dados Valorant** e valide em **⚡ Testar Conexão**.

---

## 📚 2. Usando a Biblioteca de Clipes

Na aba **📚 Biblioteca**, você gerencia todos os seus vídeos em um só lugar.

### 📥 2.1 Importar Clipes da Twitch
- Clique no botão **🟣 Importar da Twitch** no topo da página.
- Escolha o intervalo de dias (últimos 7, 30, 90 ou 365 dias).
- O aplicativo irá buscar seus clipes e adicioná-los automaticamente com título, data e prévia.

### ➕ 2.2 Adicionar Clipe Manualmente
- Clique em **➕ Adicionar Clipe**.
- Preencha o Título e insira os links da Twitch, YouTube Shorts ou Instagram Reels.

### 🔍 2.3 Busca e Filtros
- **Busca em Tempo Real:** Digite qualquer palavra no campo de busca para encontrar clipes pelo título ou notas.
- **Filtrar por Status:** Selecione apenas clipes *Novos*, *Em Edição*, *Editados* ou *Postados*.
- **Alternar Visualização:** Alterne entre os modos **Grade (Grid)** ou **Tabela (List)**.

---

## ✏️ 3. Detalhes, Edição e Vínculo de Partidas

Clique em qualquer card de clipe para abrir a tela de **Detalhes**:

- **Alterar Status:** Mude o status do clipe no menu suspenso (Novo, Editando, Editado, Postado, Descartado).
- **Anotações Auto-Salvas:** Escreva ideias de edição, hashtags e legendas. As notas são salvas automaticamente a cada alteração.
- **🏷️ Categorias:** Adicione tags como *Highlight*, *Fail*, *Play Insana* ou crie suas próprias categorias.
- **📊 Métrica do YouTube:** Clique em **🔄 Sincronizar YouTube** para carregar visualizações, likes e comentários em tempo real.
- **🎮 Partida do Valorant:** Clique em **🔗 Vincular Partida** para selecionar a partida de Valorant jogada no momento do clipe. O app exibe o Mapa, Agente, KDA e o placar final!

---

## 📊 4. Dashboard de Analytics

Na aba **📊 Dashboard**, acompanhe o crescimento das suas redes:

- **Métricas Globais:** Total de clipes cadastrados, visualizações totais acumuladas e média de curtidas.
- **Gráficos Interativos:** Veja o Top 5 clipes mais populares e a distribuição de conteúdo por status de produção.
- **Atualização Global:** Clique em **🔄 Atualizar Todos os Analytics** para atualizar os números de todos os seus clipes do YouTube de uma só vez.

---

## 💾 5. Backup e Exportação de Relatórios

Para garantir a segurança dos seus dados ou analisar métricas no Excel:

- Na página de **Configurações**:
  - **📥 Exportar Backup JSON:** Salva uma cópia completa de segurança de todos os seus clipes, categorias e históricos.
  - **📊 Exportar Clipes (CSV):** Gera uma planilha compatível com Excel e Google Sheets com os títulos, status e links.
  - **📤 Restaurar Backup JSON:** Restaura seus clipes a partir de um arquivo de backup anterior.

---

## 💡 Dúvidas ou Suporte?

O **ClipManager** roda 100% na sua máquina local de forma privativa e segura. Nenhum dado de login ou credencial é enviado para servidores externos.
