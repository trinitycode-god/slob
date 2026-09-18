/* ==========================================================================
   SLOB CONTROL — Configuração
   ========================================================================== */

const CONFIG = {

  // Cole aqui a URL do seu Web App do Google Apps Script depois do deploy.
  // Instruções completas em README.md.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbw9AS-x9wg1CD1EJYsahuTdhf3L76rJP-feDeCgAAttVPBT_6x_xtLLGHjHOM4QsUxy/exec",

  // Colunas que precisam vir PRONTAS no arquivo mensal — export direto do
  // sistema/WMS, sem nenhuma fórmula, sem coluna calculada.
  // As 5 colunas restantes de COLUNAS_BANCO_DE_DADOS (Dias/Meses sem
  // Movimentação, Classificacao SLOB, Faixa Tempo Parado, Valor Total
  // Parado) são CALCULADAS automaticamente pelo próprio SLOB CONTROL a
  // partir destas — não dependem mais de fórmula de Excel, então não
  // quebram se alguém apagar ou mover uma coluna sem querer.
  COLUNAS_BASE: [
    "Produto",
    "Armazem",
    "Descrição",
    "Saldo Atual",
    "C Unitario",
    "Custo Total",
    "Ult Compra Qtde",
    "Ult Compra Data",
    "Ult Saída Qtde",
    "Ult Saída Data",
    "Data Ult Mov"
  ],

  // A partir de quantos meses sem movimentação um item é classificado como "SLOB".
  CLASSIFICACAO_LIMITE_MESES: 18,

  // Ordem oficial das colunas da aba "Banco de Dados" / "Historico" — as 11
  // primeiras vêm do arquivo importado (COLUNAS_BASE), as 5 últimas são
  // calculadas pelo sistema. Não alterar os nomes.
  COLUNAS_BANCO_DE_DADOS: [
    "Produto",
    "Armazem",
    "Descrição",
    "Saldo Atual",
    "C Unitario",
    "Custo Total",
    "Ult Compra Qtde",
    "Ult Compra Data",
    "Ult Saída Qtde",
    "Ult Saída Data",
    "Data Ult Mov",
    "Dias sem Movimentação",
    "Meses sem Movimentação",
    "Classificacao SLOB",
    "Faixa Tempo Parado",
    "Valor Total Parado"
  ],

  // Campo usado como chave única de cada item entre uma atualização e outra.
  CHAVE_UNICA: "Produto",

  // Faixas de tempo parado usadas nos gráficos (precisam bater com os valores
  // que a própria aplicação calcula na coluna "Faixa Tempo Parado").
  FAIXAS_TEMPO_PARADO: [
    "18-24 meses",
    "24-36 meses",
    "36-48 meses",
    "48-60 meses",
    "> 60 meses"
  ],

  // Limite (em meses) usado no card "Itens > 18 meses".
  LIMITE_MESES_CARD: 18,

  // Opções sugeridas de destino (a lista não é travada — outras podem ser
  // digitadas livremente na aba Destino).
  DESTINOS_SUGERIDOS: ["Consumo", "Transferência", "Venda", "Devolução", "Descarte", "Outro"],

  CORES: {
    laranja: "#F58220",
    laranjaEscuro: "#D96D0E",
    cinza: "#6D6D6D",
    cinzaClaro: "#A9A9A2",
    bege: "#E8DCC6",
    preto: "#1A1A1A",
    branco: "#FFFFFF",
    ok: "#3F8F5C",
    alerta: "#C0392B"
  }
};
