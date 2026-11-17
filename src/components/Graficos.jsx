import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDados } from "../context/DataContext";
import { usePolling } from "../hooks/usePolling";
import { api } from "../services/api";
import { moeda, numero } from "../utils/formatacao";

const PERIODOS = [
  { chave: "1h", nome: "Última hora", ms: 60 * 60 * 1000 },
  { chave: "24h", nome: "24 horas", ms: 24 * 60 * 60 * 1000 },
  { chave: "7d", nome: "7 dias", ms: 7 * 24 * 60 * 60 * 1000 },
];
const ATUALIZAR_MS = 30000;

const COR = {
  tensao: "#4fc3f7",
  corrente: "#ffb74d",
  consumo: "#81c784",
  limite: "#e57373",
  grade: "rgba(255,255,255,0.12)",
  eixo: "rgba(255,255,255,0.7)",
};

function rotuloTempo(periodo) {
  return (ms) => {
    const d = new Date(ms);
    if (periodo === "7d") {
      return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
}

/** Gráficos de tensão, corrente e consumo, com o custo estimado do período escolhido. */
export default function Graficos() {
  const { dispositivo, leitura } = useDados();
  const [periodo, setPeriodo] = useState("1h");
  const duracao = PERIODOS.find((p) => p.chave === periodo).ms;

  const buscarDados = async () => {
    if (!dispositivo) return null;
    const ate = new Date();
    const de = new Date(ate.getTime() - duracao);
    const [pontos, consumo] = await Promise.all([
      api.historico(dispositivo, de, ate),
      api.consumo(dispositivo, de, ate),
    ]);
    return { pontos, consumo };
  };
  const { dados, erro, carregando } = usePolling(buscarDados, ATUALIZAR_MS, `${dispositivo}-${periodo}`);

  const pontos = (dados?.pontos ?? []).map((p) => ({
    ...p,
    tempo: new Date(p.inicio).getTime(),
    consumoWh: p.consumoKwh * 1000,
  }));
  const formatarTempo = rotuloTempo(periodo);
  const limites = leitura?.limites ?? {};
  const tamanhoPonto = pontos[0]?.minutos ?? 1;

  const eixoX = (
    <XAxis
      dataKey="tempo"
      type="number"
      scale="time"
      domain={["dataMin", "dataMax"]}
      tickFormatter={formatarTempo}
      stroke={COR.eixo}
      fontSize={12}
    />
  );
  const tooltip = (unidade, casas = 1) => (
    <Tooltip
      labelFormatter={(ms) => new Date(ms).toLocaleString("pt-BR")}
      formatter={(valor, nome) => [`${numero(valor, casas)} ${unidade}`, nome]}
      contentStyle={{ background: "#16213e", border: "1px solid #345", borderRadius: 8 }}
    />
  );

  return (
    <section className="painel graficos">
      <div className="painel-topo">
        <h2>Histórico</h2>
        <div className="seletor-periodo" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button
              key={p.chave}
              type="button"
              className={`botao ${periodo === p.chave ? "ativo" : ""}`}
              onClick={() => setPeriodo(p.chave)}
            >
              {p.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="resumo-consumo">
        <div>
          <span className="rotulo">Consumo no período</span>
          <span className="valor">{dados ? `${numero(dados.consumo.consumoKwh, 4)} kWh` : "—"}</span>
        </div>
        <div>
          <span className="rotulo">Custo estimado</span>
          <span className="valor destaque">{dados ? moeda(dados.consumo.custoEstimado) : "—"}</span>
        </div>
        <div>
          <span className="rotulo">Tarifa</span>
          <span className="valor">{dados ? `${moeda(dados.consumo.tarifaKwh)}/kWh` : "—"}</span>
        </div>
      </div>

      {erro && !dados && <p className="vazio">Não foi possível carregar o histórico.</p>}
      {carregando && !dados && <p className="vazio">Carregando histórico…</p>}
      {dados && pontos.length === 0 && (
        <p className="vazio">Sem leituras neste período. Os gráficos aparecem assim que o ESP32 enviar dados.</p>
      )}

      {pontos.length > 0 && (
        <>
          <p className="nota">
            Cada ponto representa {tamanhoPonto === 1 ? "1 minuto" : `${tamanhoPonto} minutos`} (média do período).
          </p>
          <div className="grafico">
            <h3>Tensão (V)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={COR.grade} />
                {eixoX}
                <YAxis stroke={COR.eixo} fontSize={12} width={48} tickFormatter={(v) => numero(v, 0)} domain={[(min) => Math.floor(Math.min(min, limites.tensaoMin ?? min) - 5), (max) => Math.ceil(Math.max(max, limites.tensaoMax ?? max) + 5)]} />
                {tooltip("V")}
                <Legend />
                {limites.tensaoMin != null && (
                  <ReferenceLine y={limites.tensaoMin} stroke={COR.limite} strokeDasharray="5 5" label={{ value: "mín", fill: COR.limite, fontSize: 11 }} />
                )}
                {limites.tensaoMax != null && (
                  <ReferenceLine y={limites.tensaoMax} stroke={COR.limite} strokeDasharray="5 5" label={{ value: "máx", fill: COR.limite, fontSize: 11 }} />
                )}
                <Line type="monotone" dataKey="tensaoMedia" name="Tensão média" stroke={COR.tensao} dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico">
            <h3>Corrente (A)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={COR.grade} />
                {eixoX}
                <YAxis stroke={COR.eixo} fontSize={12} width={48} tickFormatter={(v) => numero(v, 1)} domain={[0, (max) => Math.ceil(Math.max(max, limites.correnteMax ?? 0) + 1)]} />
                {tooltip("A", 2)}
                <Legend />
                {limites.correnteMax != null && (
                  <ReferenceLine y={limites.correnteMax} stroke={COR.limite} strokeDasharray="5 5" label={{ value: "limite", fill: COR.limite, fontSize: 11 }} />
                )}
                <Line type="monotone" dataKey="correnteMedia" name="Corrente média" stroke={COR.corrente} dot={false} strokeWidth={2} isAnimationActive={false} />
                <Line type="monotone" dataKey="correnteMax" name="Corrente máxima" stroke={COR.corrente} strokeOpacity={0.45} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico">
            <h3>Consumo (Wh por ponto)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={COR.grade} />
                {eixoX}
                <YAxis stroke={COR.eixo} fontSize={12} width={48} tickFormatter={(v) => numero(v, 1)} />
                {tooltip("Wh", 2)}
                <Bar dataKey="consumoWh" name="Consumo" fill={COR.consumo} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
