import { useDados } from "../context/DataContext";
import { NOMES_ALERTA, dataHora, numero } from "../utils/formatacao";

/** Faixas no topo da tela: servidor fora, dispositivo offline/sem dados e, principalmente, alerta ativo. */
export default function Avisos() {
  const { leitura, situacao, servidorFora, carregando, dispositivo } = useDados();
  const avisos = [];

  if (servidorFora) {
    avisos.push(
      <div key="servidor" className="aviso aviso-cinza" role="status">
        <strong>Servidor fora do ar.</strong> Tentando reconectar automaticamente… Os valores mostrados podem estar
        desatualizados.
      </div>,
    );
  } else if (!carregando && !dispositivo) {
    avisos.push(
      <div key="nenhum" className="aviso aviso-cinza" role="status">
        Nenhum dispositivo configurado no servidor (variável FLOWSENSE_DISPOSITIVOS).
      </div>,
    );
  } else if (!carregando && situacao === "sem-dados") {
    avisos.push(
      <div key="sem-dados" className="aviso aviso-cinza" role="status">
        <strong>Aguardando a primeira leitura de {dispositivo}.</strong> Verifique se o ESP32 (Wokwi) está rodando e
        conectado ao broker MQTT.
      </div>,
    );
  } else if (situacao === "offline") {
    const ultimoAlerta = leitura?.alerta && leitura.alerta !== "NORMAL" ? NOMES_ALERTA[leitura.alerta] : null;
    avisos.push(
      <div key="offline" className="aviso aviso-laranja" role="status">
        <strong>Dispositivo offline.</strong> Última leitura recebida em {dataHora(leitura?.recebidoEm)}. Os valores
        abaixo são os últimos conhecidos.
        {ultimoAlerta && ` Na última leitura havia alerta de ${ultimoAlerta.toLowerCase()}.`}
      </div>,
    );
  }

  // A faixa vermelha só aparece com o dispositivo online: offline, o alerta é de dados antigos.
  const alerta = leitura?.alerta;
  if (situacao === "online" && alerta && alerta !== "NORMAL") {
    const limites = leitura.limites ?? {};
    // Relé desligado com alerta = a proteção disparou (5 s fora da faixa) e está travada até o rearme.
    // O alerta fica no motivo do desligamento, mesmo que os valores já tenham voltado.
    const disparou = leitura.rele === "OFF";
    let detalhe = "";
    if (disparou) {
      detalhe = `${NOMES_ALERTA[alerta] ?? alerta} por mais de 5 s: a proteção desligou a carga e o buzzer toca até você clicar em "Ligar carga".`;
    } else if (alerta === "SOBRECORRENTE") {
      detalhe = `Corrente de ${numero(leitura.corrente)} A, acima do limite de ${numero(limites.correnteMax)} A.`;
    } else if (alerta === "SOBRETENSAO") {
      detalhe = `Tensão de ${numero(leitura.tensao)} V, acima do limite de ${numero(limites.tensaoMax)} V.`;
    } else if (alerta === "SUBTENSAO") {
      detalhe = `Tensão de ${numero(leitura.tensao)} V, abaixo do limite de ${numero(limites.tensaoMin)} V.`;
    }
    avisos.push(
      <div key="alerta" className="aviso aviso-alerta" role="alert">
        <span className="aviso-icone">⚠</span>
        <div>
          <strong>
            {disparou ? "PROTEÇÃO DISPARADA" : "ALERTA"}: {NOMES_ALERTA[alerta] ?? alerta}
          </strong>
          <p>
            {detalhe}
            {!disparou && " Se continuar por 5 s, a carga será desligada."}
          </p>
        </div>
      </div>,
    );
  }

  return avisos.length > 0 ? <section className="avisos">{avisos}</section> : null;
}
