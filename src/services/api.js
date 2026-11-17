// Cliente da API REST do backend. Todo acesso a dados passa por aqui.
//
// VITE_API_URL: endereço do backend. Vazio = mesmo endereço do site (o nginx/vite repassa /api ao backend).
// VITE_API_KEY: chave enviada no cabeçalho X-API-Key nos comandos (POST/PUT).
const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_KEY = import.meta.env.VITE_API_KEY || "";
const TEMPO_LIMITE_MS = 8000;

/** Erro de API com o status HTTP (0 = servidor inacessível) e os erros por campo, se houver. */
export class ApiErro extends Error {
  constructor(mensagem, status, campos = null) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
  }

  /** Backend fora do ar ou com erro interno (diferente de "dado não encontrado" ou "dado inválido"). */
  get servidorIndisponivel() {
    return this.status === 0 || this.status >= 500;
  }
}

async function requisitar(caminho, metodo = "GET", corpo) {
  const cabecalhos = {};
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  if (metodo !== "GET") cabecalhos["X-API-Key"] = API_KEY;

  let resposta;
  try {
    resposta = await fetch(BASE_URL + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch {
    throw new ApiErro("Não foi possível falar com o servidor.", 0);
  }

  const texto = await resposta.text();
  let json = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = null; // ex.: página de erro do nginx quando o backend está fora
  }

  if (!resposta.ok) {
    const mensagem = json?.mensagem || `Erro ${resposta.status} ao acessar o servidor.`;
    throw new ApiErro(mensagem, resposta.status === 502 || resposta.status === 504 ? 0 : resposta.status, json?.campos);
  }
  return json;
}

const rota = (id, sufixo) => `/api/dispositivos/${encodeURIComponent(id)}/${sufixo}`;
const periodo = (de, ate) => `de=${de.toISOString()}&ate=${ate.toISOString()}`;

export const api = {
  dispositivos: () => requisitar("/api/dispositivos"),
  leituraAtual: (id) => requisitar(rota(id, "leitura-atual")),
  historico: (id, de, ate) => requisitar(rota(id, `historico?${periodo(de, ate)}`)),
  consumo: (id, de, ate) => requisitar(rota(id, `consumo?${periodo(de, ate)}`)),
  eventos: (id, limite = 30) => requisitar(rota(id, `eventos?limite=${limite}`)),
  alterarRele: (id, estado) => requisitar(rota(id, "rele"), "POST", { estado }),
  alterarLimites: (id, limites) => requisitar(rota(id, "limites"), "PUT", limites),
  alterarIntervalo: (id, intervalo) => requisitar(rota(id, "intervalo"), "PUT", { intervalo }),
};
