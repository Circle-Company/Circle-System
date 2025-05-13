#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${2}${1}${NC}"
}

# Verificar se o ambiente está configurado
if [ -z "$NODE_ENV" ]; then
    print_message "NODE_ENV não definido. Usando 'development'" "$YELLOW"
    export NODE_ENV=development
fi

# Configurar variáveis de ambiente para teste
export TEST_RECOMMENDATION=true
export TEST_USER_ID=${TEST_USER_ID:-"1"}
export TEST_INTERACTIONS=${TEST_INTERACTIONS:-"false"}

# Verificar se o banco de dados está acessível
print_message "Verificando conexão com o banco de dados..." "$YELLOW"
if ! npx sequelize-cli db:migrate:status > /dev/null 2>&1; then
    print_message "Erro: Não foi possível conectar ao banco de dados" "$RED"
    exit 1
fi

# Executar migrações se necessário
print_message "Verificando migrações pendentes..." "$YELLOW"
if npx sequelize-cli db:migrate:status | grep -q "pending"; then
    print_message "Executando migrações pendentes..." "$YELLOW"
    npx sequelize-cli db:migrate
fi

# Executar os testes
print_message "Iniciando testes do sistema de recomendação..." "$GREEN"
print_message "Usando usuário de teste: $TEST_USER_ID" "$YELLOW"
print_message "Teste de interações: $TEST_INTERACTIONS" "$YELLOW"

# Executar o script de teste
npx ts-node src/swipe-engine/test-init.ts

# Verificar o resultado
if [ $? -eq 0 ]; then
    print_message "Testes concluídos com sucesso!" "$GREEN"
else
    print_message "Erro durante a execução dos testes" "$RED"
    exit 1
fi 