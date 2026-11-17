import { useDados } from "../context/DataContext";
import { haQuantoTempo } from "../utils/formatacao";

const TEXTO_SITUACAO = {
  online: "Dispositivo online",
  offline: "Dispositivo offline",
  "sem-dados": "Aguardando dados",
};

export default function Cabecalho() {
  const { dispositivos, dispositivo, setDispositivo, leitura, situacao, servidorFora, agora } = useDados();

  return (
    <header className="cabecalho">
      <div className="marca">
        <h1>⚡ FlowSense</h1>
        <p>Monitoramento de energia em tempo real</p>
      </div>

      <div className="cabecalho-status">
        {dispositivos.length > 1 ? (
          <select
            aria-label="Dispositivo"
            value={dispositivo ?? ""}
            onChange={(e) => setDispositivo(e.target.value)}
          >
            {dispositivos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id}
              </option>
            ))}
          </select>
        ) : (
          dispositivo && <span className="chip neutro">{dispositivo}</span>
        )}

        <span className={`chip ${servidorFora ? "erro" : "ok"}`}>
          <span className="bolinha" /> {servidorFora ? "Servidor fora do ar" : "Servidor conectado"}
        </span>

        {!servidorFora && (
          <span className={`chip ${situacao === "online" ? "ok" : situacao === "offline" ? "erro" : "neutro"}`}>
            <span className="bolinha" /> {TEXTO_SITUACAO[situacao]}
          </span>
        )}

        {leitura?.recebidoEm && (
          <span className="atualizado">Última leitura {haQuantoTempo(leitura.recebidoEm, agora)}</span>
        )}
      </div>
    </header>
  );
}
