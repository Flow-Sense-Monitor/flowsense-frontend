import { useState } from "react";
import PropTypes from "prop-types";
import { useDados } from "../context/DataContext";
import { api } from "../services/api";

/**
 * Estado do relé e botão para ligar/desligar a carga. Pede confirmação antes de enviar
 * e mostra o resultado. O estado real só muda quando o ESP32 responde com uma nova leitura.
 */
export default function ControleRele({ aoEnviarComando }) {
  const { dispositivo, leitura, situacao, recarregarLeitura } = useDados();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // { tipo: "ok" | "erro", texto }

  const ligado = leitura?.rele === "ON";
  const novoEstado = ligado ? "OFF" : "ON";
  const desabilitado = !dispositivo || !leitura || enviando;

  async function enviar() {
    setConfirmando(false);
    setEnviando(true);
    setResultado(null);
    try {
      await api.alterarRele(dispositivo, novoEstado);
      setResultado({
        tipo: "ok",
        texto: `Comando "${novoEstado === "ON" ? "ligar" : "desligar"}" enviado. O ESP32 confirma em instantes.`,
      });
      recarregarLeitura();
      aoEnviarComando?.();
    } catch (e) {
      setResultado({ tipo: "erro", texto: e.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`card card-${!leitura || situacao !== "online" ? "apagado" : ligado ? "ok" : "alerta"} controle-rele`}>
      <div className="card-header">
        <span className="icone" aria-hidden="true">
          🔌
        </span>
        <h2>Carga (relé)</h2>
      </div>
      <div className="card-valor">
        <span className="numero texto">{leitura ? (ligado ? "LIGADA" : "DESLIGADA") : "—"}</span>
      </div>

      {!confirmando ? (
        <button
          type="button"
          className={ligado ? "botao perigo" : "botao primario"}
          disabled={desabilitado}
          onClick={() => setConfirmando(true)}
        >
          {enviando ? "Enviando…" : ligado ? "Desligar carga" : "Ligar carga"}
        </button>
      ) : (
        <div className="confirmacao">
          <p>
            Confirma {ligado ? "DESLIGAR" : "LIGAR"} a carga?
            {situacao === "offline" && " (o dispositivo parece offline; o comando pode não chegar)"}
          </p>
          <div className="botoes">
            <button type="button" className={ligado ? "botao perigo" : "botao primario"} onClick={enviar}>
              Sim, {ligado ? "desligar" : "ligar"}
            </button>
            <button type="button" className="botao" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {resultado && <p className={`mensagem ${resultado.tipo}`}>{resultado.texto}</p>}
    </div>
  );
}

ControleRele.propTypes = {
  aoEnviarComando: PropTypes.func,
};
