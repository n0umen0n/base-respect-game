FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

ARG RUST_TOOLCHAIN="1.87.0"
ARG SOLANA_CLI="2.1.21"
ARG ANCHOR_CLI="0.31.0"
ARG NODE_VERSION="node"

USER vscode

RUN sudo apt-get update && sudo apt-get install -y \
    build-essential \
    pkg-config \
    libudev-dev \
    llvm \
    libclang-dev \
    protobuf-compiler \
    libssl-dev \
    golang-go

SHELL ["/bin/zsh", "-c"]

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN source /home/vscode/.cargo/env && \
    rustup toolchain install ${RUST_TOOLCHAIN} && \
    rustup default ${RUST_TOOLCHAIN}

RUN cd /tmp && git clone --depth 1 --branch v${SOLANA_CLI} https://github.com/anza-xyz/agave.git && \
    cd agave && CARGO_BUILD_JOBS=8 scripts/cargo-install-all.sh ~/.local

RUN cargo install --git https://github.com/coral-xyz/anchor --tag v${ANCHOR_CLI} anchor-cli

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
RUN source /home/vscode/.nvm/nvm.sh && \
    nvm install ${NODE_VERSION} && \
    nvm use ${NODE_VERSION} && \
    nvm alias default ${NODE_VERSION} && \
    npm install -g yarn
    
RUN curl -L https://foundry.paradigm.xyz | bash &&

RUN curl -fsSL https://bun.sh/install | bash

SHELL ["/bin/bash", "--login", "-i", "-c"]

RUN foundryup
    