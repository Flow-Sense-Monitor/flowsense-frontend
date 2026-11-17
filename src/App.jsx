import Avisos from "./components/Avisos";
import Cabecalho from "./components/Cabecalho";
import Card from "./components/Card";
import Configuracao from "./components/Configuracao";
import ControleRele from "./components/ControleRele";
import Graficos from "./components/Graficos";
import ListaEventos from "./components/ListaEventos";
import { useDados } from "./context/DataContext";
import { usePolling } from "./hooks/usePolling";
import { api } from "./services/api";
import { NOMES_ALERTA, numero } from "./utils/formatacao";
import "./styles/Dashboard.css";

const ATUALIZAR_EVENTOS_MS = 5000;

function App() {
  const { dispositivo, leitura, situacao, carregando } = useDados();
  const eventos = usePolling(
    () => (dispositivo ? api.eventos(dispositivo, 30) : Promise.resolve(null)),
    ATUALIZAR_EVENTOS_MS,
    dispositivo ?? "",
  );

  // Dado antigo (dispositivo offline) aparece apagado; valores fora do limite ficam vermelhos.
  const apagado = situacao !== "online";
  const lim = leitura?.limites ?? {};
  const alerta = leitura?.alerta ?? null;
  const tensaoFora = alerta === "SOBRETENSAO" || alerta === "SUBTENSAO";
  const correnteFora = alerta === "SOBRECORRENTE";
  const estado = (fora) => (apagado ? "apagado" : fora ? "alerta" : "normal");

  if (carregando && !leitura) {
    return (
      <div className="dashboard">
        <Cabecalho />
        <p className="carregando">Carregando dados do FlowSense…</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Cabecalho />
      <Avisos />

      <main className="cards-container">
        <Card
          titulo="Tensão"
          valor={leitura?.tensao}
          unidade="V"
          icone="⚡"
          estado={estado(tensaoFora)}
          detalhe={lim.tensaoMin != null && `Faixa aceita: ${numero(lim.tensaoMin)} a ${numero(lim.tensaoMax)} V`}
        />
        <Card
          titulo="Corrente"
          valor={leitura?.corrente}
          unidade="A"
          casas={2}
          icone="〰"
          estado={estado(correnteFora)}
          detalhe={lim.correnteMax != null && `Limite: ${numero(lim.correnteMax)} A`}
        />
        <Card
          titulo="Potência"
          valor={leitura?.potencia}
          unidade="W"
          casas={0}
          icone="💡"
          estado={estado(false)}
          detalhe={leitura?.rele === "OFF" ? "Carga desligada: sem consumo" : "Potência ativa medida"}
        />
        <Card
          titulo="Consumo acumulado"
          valor={leitura?.kwh}
          unidade="kWh"
          casas={4}
          icone="📈"
          estado={estado(false)}
          detalhe="Desde o último reinício do ESP32"
        />
        <Card
          titulo="Alerta atual"
          valor={alerta ? (NOMES_ALERTA[alerta] ?? alerta) : "—"}
          icone={alerta && alerta !== "NORMAL" ? "⚠" : "✔"}
          estado={apagado || !alerta ? "apagado" : alerta !== "NORMAL" ? "alerta" : "ok"}
          detalhe={alerta === "NORMAL" ? "Tensão e corrente dentro dos limites" : null}
        />
        <ControleRele aoEnviarComando={eventos.recarregar} />
      </main>

      <div className="secoes">
        <Graficos />
        <div className="coluna-lateral">
          <ListaEventos eventos={eventos.dados} erro={eventos.erro} carregando={eventos.carregando} />
          <Configuracao aoEnviarComando={eventos.recarregar} />
        </div>
      </div>

      <footer className="rodape">
        FlowSense · ESP32 → MQTT → Spring Boot → MySQL → Dashboard
        {leitura?.intervaloMs ? ` · leituras a cada ${numero(leitura.intervaloMs / 1000, 1)} s` : ""}
      </footer>
    </div>
  );
}

export default App;
