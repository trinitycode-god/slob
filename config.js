/* ==========================================================================
   SLOB CONTROL — Configuração
   ========================================================================== */

const CONFIG = {

  // Cole aqui a URL do seu Web App do Google Apps Script depois do deploy.
  // Instruções completas em README.md.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbw9AS-x9wg1CD1EJYsahuTdhf3L76rJP-feDeCgAAttVPBT_6x_xtLLGHjHOM4QsUxy/exec",

  // Ordem oficial das colunas da aba "Banco de Dados" / arquivo de importação.
  // Não alterar os nomes — precisam bater exatamente com o cabeçalho da planilha.
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
    "Verificação",
    "Condição",
    "Dias sem Movimentação",
    "Meses sem Movimentação",
    "Classificacao SLOB",
    "Faixa Tempo Parado",
    "Valor Total Parado"
  ],

  // Campo usado como chave única de cada item entre uma atualização e outra.
  CHAVE_UNICA: "Produto",

  // Faixas de tempo parado usadas nos gráficos (precisam bater com os valores
  // que aparecem na coluna "Faixa Tempo Parado" da planilha).
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
