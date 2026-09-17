# SLOB CONTROL

Sistema web para controle mensal de itens SLOB (Slow Moving / sem movimentação).
Front-end estático (HTML/CSS/JS puro, hospedado no GitHub Pages) + backend em
Google Apps Script + Google Sheets como banco de dados.

---

## 1. Estrutura do projeto

```
/
├── index.html          → estrutura da aplicação (SPA)
├── style.css           → identidade visual
├── config.js           → URL do backend e constantes (editar aqui)
├── script.js           → toda a lógica (rotas, importação, gráficos, tabelas)
├── apps-script/
│   └── Code.gs          → backend, cole dentro do Apps Script da planilha
└── README.md
```

## 2. Preparar a planilha do Google Sheets

Crie uma planilha nova com **exatamente 3 abas**, com esses nomes:

### Aba "Banco de Dados"
Linha 1 (cabeçalho) com estas 18 colunas, nesta ordem e com esses nomes exatos:

```
Produto | Armazem | Descrição | Saldo Atual | C Unitario | Custo Total |
Ult Compra Qtde | Ult Compra Data | Ult Saída Qtde | Ult Saída Data |
Data Ult Mov | Verificação | Condição | Dias sem Movimentação |
Meses sem Movimentação | Classificacao SLOB | Faixa Tempo Parado |
Valor Total Parado
```

### Aba "Historico"
Mesmas 18 colunas acima, mas com **"Data da Atualização"** antes de "Produto"
e **"Motivo"** depois de "Valor Total Parado".

### Aba "Destino"
```
Produto | Armazem | Descrição | Quantidade | Valor Unitário | Valor Total |
Data Saída SLOB | Destino | Responsável | Data Definição | Observação | Status
```

> Os nomes das colunas precisam ser idênticos aos do arquivo mensal que você
> vai importar — o sistema lê o cabeçalho do arquivo e casa coluna a coluna.

## 3. Publicar o backend (Google Apps Script)

1. Na planilha, vá em **Extensões → Apps Script**.
2. Apague o conteúdo padrão de `Code.gs` e cole o conteúdo do arquivo
   `apps-script/Code.gs` deste projeto.
3. Clique em **Implantar → Nova implantação**.
4. Tipo: **App da Web**.
5. Configurações:
   - **Executar como:** Eu (sua conta)
   - **Quem pode acessar:** Qualquer pessoa
6. Clique em **Implantar**, autorize as permissões pedidas.
7. Copie a **URL do app da web** gerada (termina em `/exec`).

> Sempre que você editar o `Code.gs`, é preciso criar uma **nova implantação**
> (ou gerenciar implantações → editar → nova versão) para as mudanças valerem.

## 4. Configurar o front-end

Abra `config.js` e cole a URL copiada no passo anterior:

```js
APPS_SCRIPT_URL: "https://script.google.com/macros/s/SEU_ID_AQUI/exec",
```

## 5. Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie os arquivos `index.html`, `style.css`,
   `config.js` e `script.js` (a pasta `apps-script/` não precisa ir para o
   GitHub Pages, ela só existe como referência do que colar no Apps Script).
2. Em **Settings → Pages**, selecione a branch principal e a pasta raiz (`/`).
3. Acesse a URL gerada pelo GitHub Pages — o sistema já deve carregar os
   dados da planilha.

## 6. Como funciona a importação mensal

Todo mês, na aba **Atualizar SLOB**, você envia a planilha (.xlsx, .xls ou
.csv) com o snapshot atual do SLOB (mesmas 18 colunas do Banco de Dados). O
sistema:

1. Lê o arquivo no navegador (nenhum dado sai do seu computador até você
   clicar em "Confirmar importação").
2. Compara os produtos do arquivo com os que já estavam no Banco de Dados,
   usando o **código do Produto** como chave única.
3. Ao confirmar:
   - o **Banco de Dados** é substituído pelo novo snapshot;
   - produtos que **sumiram** do arquivo (saíram do SLOB) viram uma linha no
     **Historico** (com "Motivo" em branco) e uma linha pendente na aba
     **Destino**;
   - produtos **novos** entram direto no Banco de Dados;
   - produtos que **continuam** simplesmente têm seus dados atualizados.
4. Na aba **Destino**, ao definir o destino de um item pendente (Consumo,
   Venda, Descarte, etc.) e salvar, o campo **Motivo** correspondente no
   Historico é preenchido automaticamente com esse destino.

## 7. Observações técnicas

- O front-end é 100% estático — pode ser hospedado em qualquer lugar que
  sirva arquivos HTML (GitHub Pages, Netlify, etc.), não só GitHub Pages.
- As requisições `POST` são enviadas com `Content-Type: text/plain` de
  propósito — é um contorno padrão para evitar o preflight `OPTIONS`, que o
  Apps Script não trata bem. O corpo continua sendo JSON normal.
- Datas de células do Excel são convertidas automaticamente para
  `dd/MM/yyyy` tanto na importação quanto na leitura da planilha.
- Números com formatação brasileira (`1.234,56`) são interpretados
  corretamente pelas funções de exibição e pelos gráficos.
