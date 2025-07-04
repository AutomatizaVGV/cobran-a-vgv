<<<<<<< HEAD
# 🚀 Guia de Configuração Rápida

## 📋 Pré-requisitos

### 1. Instalar Node.js
- Baixe em: https://nodejs.org/
- Escolha a versão LTS
- Instale e reinicie o terminal

### 2. Verificar Instalação
```bash
node --version
npm --version
```

## 🔧 Configuração do Projeto

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Supabase

#### Criar Projeto Supabase:
1. Acesse: https://supabase.com/
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Anote a URL e chave anônima

#### Configurar Variáveis:
Crie arquivo `.env.local` na raiz:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 3. Executar Migrações

#### Instalar Supabase CLI:
```bash
npm install -g supabase
```

#### Fazer Login:
```bash
supabase login
```

#### Aplicar Migrações:
```bash
supabase db push
```

### 4. Iniciar Sistema
```bash
npm run dev
```

### 5. Acessar Sistema
- Abra: http://localhost:5173
- Faça login com email/senha
- Explore as funcionalidades

## 🎯 Funcionalidades Disponíveis

### Para Administradores:
- ✅ Dashboard Executivo
- ✅ Integração Google Sheets
- ✅ Distribuição de Cobranças
- ✅ Relatórios Avançados
- ✅ Sistema de Notificações
- ✅ Automação de Ações
- ✅ Integração PIX

### Para Usuários:
- ✅ Dashboard de Cobranças
- ✅ Cadência de Mensagens
- ✅ Métricas Diárias
- ✅ Filtros Avançados

## 🛠️ Solução de Problemas

### Erro: "npm não é reconhecido"
- Reinstale o Node.js
- Reinicie o terminal

### Erro: "Supabase não conectado"
- Verifique as variáveis de ambiente
- Confirme a URL e chave do Supabase

### Erro: "Migrações falharam"
- Verifique se está logado no Supabase CLI
- Confirme as permissões do projeto

## 📞 Suporte

Se encontrar problemas:
1. Verifique se Node.js está instalado
2. Confirme as variáveis de ambiente
=======
# 🚀 Guia de Configuração Rápida

## 📋 Pré-requisitos

### 1. Instalar Node.js
- Baixe em: https://nodejs.org/
- Escolha a versão LTS
- Instale e reinicie o terminal

### 2. Verificar Instalação
```bash
node --version
npm --version
```

## 🔧 Configuração do Projeto

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Supabase

#### Criar Projeto Supabase:
1. Acesse: https://supabase.com/
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Anote a URL e chave anônima

#### Configurar Variáveis:
Crie arquivo `.env.local` na raiz:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 3. Executar Migrações

#### Instalar Supabase CLI:
```bash
npm install -g supabase
```

#### Fazer Login:
```bash
supabase login
```

#### Aplicar Migrações:
```bash
supabase db push
```

### 4. Iniciar Sistema
```bash
npm run dev
```

### 5. Acessar Sistema
- Abra: http://localhost:5173
- Faça login com email/senha
- Explore as funcionalidades

## 🎯 Funcionalidades Disponíveis

### Para Administradores:
- ✅ Dashboard Executivo
- ✅ Integração Google Sheets
- ✅ Distribuição de Cobranças
- ✅ Relatórios Avançados
- ✅ Sistema de Notificações
- ✅ Automação de Ações
- ✅ Integração PIX

### Para Usuários:
- ✅ Dashboard de Cobranças
- ✅ Cadência de Mensagens
- ✅ Métricas Diárias
- ✅ Filtros Avançados

## 🛠️ Solução de Problemas

### Erro: "npm não é reconhecido"
- Reinstale o Node.js
- Reinicie o terminal

### Erro: "Supabase não conectado"
- Verifique as variáveis de ambiente
- Confirme a URL e chave do Supabase

### Erro: "Migrações falharam"
- Verifique se está logado no Supabase CLI
- Confirme as permissões do projeto

## 📞 Suporte

Se encontrar problemas:
1. Verifique se Node.js está instalado
2. Confirme as variáveis de ambiente
>>>>>>> 9c2dcd0b612cc2766e1ecc6827b32c641c7d64ba
3. Execute `npm run dev` para ver erros detalhados 