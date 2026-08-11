#!/usr/bin/env bash
# ==============================================================================
# Assuna - Clip Manager — Script de Instalação de Dependências no Linux
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   🎬 Assuna - Clip Manager — Linux Installer       ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

# 1. Detectar distribuição Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO=$ID
else
    echo -e "${RED}Não foi possível detectar a distribuição Linux em /etc/os-release.${NC}"
    exit 1
fi

echo -e "${GREEN}[+] Distribuição detectada:${NC} $NAME ($DISTRO)"
echo ""

# 2. Instalar dependências do sistema para Tauri 2.x
echo -e "${BLUE}[1/3] Instalando dependências de sistema (WebKitGTK, GTK3, AppIndicator)...${NC}"

case "$DISTRO" in
    ubuntu|debian|pop|mint|elementary)
        echo -e "${YELLOW}Executando apt-get update & install...${NC}"
        sudo apt-get update
        sudo apt-get install -y \
            build-essential \
            curl \
            wget \
            file \
            libssl-dev \
            libgtk-3-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev \
            javascriptcoregtk-4.1 \
            libwebkit2gtk-4.1-dev \
            pkg-config
        ;;
    fedora|rhel)
        echo -e "${YELLOW}Executando dnf install...${NC}"
        sudo dnf install -y \
            gcc \
            gcc-c++ \
            make \
            openssl-devel \
            gtk3-devel \
            webkit2gtk4.1-devel \
            libappindicator-gtk3-devel \
            librsvg2-devel \
            pkg-config
        ;;
    arch|manjaro|endeavouros)
        echo -e "${YELLOW}Executando pacman -S...${NC}"
        sudo pacman -S --needed --noconfirm \
            base-devel \
            curl \
            wget \
            openssl \
            gtk3 \
            webkit2gtk-4.1 \
            libappindicator-gtk3 \
            librsvg \
            pkgconf
        ;;
    opensuse*|suse)
        echo -e "${YELLOW}Executando zypper install...${NC}"
        sudo zypper install -y \
            devel_basis \
            curl \
            wget \
            libopenssl-devel \
            gtk3-devel \
            webkit2gtk3-devel \
            libappindicator3-devel \
            librsvg-devel \
            pkg-config
        ;;
    *)
        echo -e "${RED}Distribuição '$DISTRO' não reconhecida automaticamente.${NC}"
        echo "Instale manualmente: webkit2gtk-4.1, gtk3, libappindicator3, librsvg e pkg-config."
        ;;
esac

echo -e "${GREEN}[✓] Dependências de sistema instaladas com sucesso!${NC}"
echo ""

# 3. Verificar Rust / Cargo
echo -e "${BLUE}[2/3] Verificando instalação do Rust...${NC}"
if command -v cargo &> /dev/null; then
    RUST_VER=$(cargo --version)
    echo -e "${GREEN}[✓] Rust encontrado:${NC} $RUST_VER"
else
    echo -e "${YELLOW}[!] Rust não foi encontrado no sistema.${NC}"
    read -p "Deseja instalar o Rust via rustup agora? (S/n): " confirm_rust
    if [[ "$confirm_rust" =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}Instalação do Rust ignorada. Lembre-se de instalar o Rust para rodar o app.${NC}"
    else
        echo -e "${BLUE}Instalando Rust via rustup.rs...${NC}"
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        echo -e "${GREEN}[✓] Rust instalado com sucesso!${NC}"
    fi
fi
echo ""

# 4. Verificar Node.js e pnpm
echo -e "${BLUE}[3/3] Verificando ambiente Node.js & pnpm...${NC}"
if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    echo -e "${GREEN}[✓] Node.js encontrado:${NC} $NODE_VER"
else
    echo -e "${RED}[!] Node.js não foi encontrado. Por favor, instale o Node.js v18+ para continuar.${NC}"
fi

if command -v pnpm &> /dev/null; then
    PNPM_VER=$(pnpm --version)
    echo -e "${GREEN}[✓] pnpm encontrado:${NC} v$PNPM_VER"
else
    echo -e "${YELLOW}[!] pnpm não foi encontrado.${NC}"
    read -p "Deseja instalar o pnpm globalmente via npm/corepack? (S/n): " confirm_pnpm
    if [[ ! "$confirm_pnpm" =~ ^[Nn]$ ]]; then
        if command -v npm &> /dev/null; then
            sudo npm install -g pnpm
            echo -e "${GREEN}[✓] pnpm instalado com sucesso!${NC}"
        else
            echo -e "${YELLOW}npm não encontrado. Instale o pnpm manualmente (https://pnpm.io/installation).${NC}"
        fi
    fi
fi
echo ""

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  🎉 Tudo pronto para rodar o Assuna - Clip Manager! ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo "Para rodar o app em modo de desenvolvimento:"
echo -e "  ${BLUE}pnpm install${NC}"
echo -e "  ${BLUE}pnpm tauri dev${NC}"
echo ""
echo "Se estiver em ambiente Wayland puro com erro de protocolo:"
echo -e "  ${BLUE}GDK_BACKEND=x11 pnpm tauri dev${NC}"
echo ""
