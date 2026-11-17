// Funções de formatação e de interpretação do estado do dispositivo.

export function numero(valor, casas = 1) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function moeda(valor) {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

export function hora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR");
}

/** "há 5 s", "há 3 min", "há 2 h" */
export function haQuantoTempo(iso, agora = Date.now()) {
  if (!iso) return "nunca";
  const segundos = Math.max(0, Math.round((agora - new Date(iso).getTime()) / 1000));
  if (segundos < 60) return `há ${segundos} s`;
  if (segundos < 3600) return `há ${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `há ${Math.floor(segundos / 3600)} h`;
  return `há ${Math.floor(segundos / 86400)} dias`;
}

export const NOMES_ALERTA = {
  NORMAL: "Normal",
  SOBRETENSAO: "Sobretensão",
  SUBTENSAO: "Subtensão",
  SOBRECORRENTE: "Sobrecorrente",
};

/**
 * Situação do dispositivo:
 *  - "sem-dados": o backend nunca recebeu leitura dele;
 *  - "offline":   o broker avisou que ele caiu, ou parou de mandar leituras;
 *  - "online":    leituras chegando normalmente.
 * Consideramos "parou de mandar" quando passa de 3 intervalos (mínimo 15 s) sem leitura.
 */
export function situacaoDispositivo(leitura, agora = Date.now()) {
  if (!leitura || leitura.tensao === null || leitura.tensao === undefined) return "sem-dados";
  if (!leitura.online) return "offline";
  const intervalo = leitura.intervaloMs || 2000;
  const limite = Math.max(3 * intervalo, 15000);
  const atraso = agora - new Date(leitura.recebidoEm).getTime();
  return atraso > limite ? "offline" : "online";
}
