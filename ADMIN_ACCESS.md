# Acesso Administrativo - TranslateEvent V5

## ⚠️ PROBLEMA RESOLVIDO - CREDENCIAIS FUNCIONAIS

### Credenciais do Super Admin (FUNCIONAIS)
- **Email**: `superadmin@translateevent.com`
- **Senha**: `TranslateEvent2024!`
- **Role**: SUPER_ADMIN

## Como Configurar (MÉTODO CORRETO)

### ✅ Método Recomendado - Setup Automático
1. **Acesse**: `/setup/create-admin`
2. **Configure as credenciais** (ou use as padrão)
3. **Clique em "Criar Super Admin"**
4. **Faça login em**: `/auth/login`
5. **Será redirecionado para**: `/admin`

### ⚠️ Problema Anterior
O script SQL anterior apenas criava o registro na tabela `users`, mas não criava o usuário no Supabase Auth, causando "Invalid login credentials".

### ✅ Solução Implementada
A página `/setup/create-admin` agora:
- Cria o usuário no Supabase Auth
- Cria o perfil na tabela `users`
- Confirma o email automaticamente
- Garante que o login funcione perfeitamente

## Níveis de Acesso

### SUPER_ADMIN
- Acesso completo ao sistema
- Gerenciamento de usuários e roles
- Configurações de sistema
- Todos os painéis administrativos

### TRANSLATOR
- Painel do tradutor
- Controle de canais de tradução
- Configurações de áudio
- Estatísticas de tradução

### USER (Participante)
- Acesso aos eventos públicos
- Seleção de idiomas
- Notas e participação em polls

## URLs de Acesso

- **Setup Inicial**: `/setup/create-admin` ⭐
- **Login**: `/auth/login`
- **Registro**: `/auth/register` (apenas Participante/Tradutor)
- **Painel Admin**: `/admin`
- **Painel Tradutor**: `/translator`
- **Eventos**: `/events`

## Primeiro Acesso - PASSO A PASSO

1. **Acesse**: `http://localhost:3000/setup/create-admin`
2. **Use as credenciais padrão** ou personalize
3. **Clique "Criar Super Admin"**
4. **Aguarde confirmação de sucesso**
5. **Acesse**: `http://localhost:3000/auth/login`
6. **Login**: `superadmin@translateevent.com`
7. **Senha**: `TranslateEvent2024!`
8. **Será redirecionado para**: `/admin`

## Segurança

- ✅ Registro público não permite criar admins
- ✅ Apenas Participante e Tradutor no registro público
- ✅ Super Admin criado via setup protegido
- ✅ Senhas fortes obrigatórias
- ✅ Confirmação automática de email no setup
</md>
