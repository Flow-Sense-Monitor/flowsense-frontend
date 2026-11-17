import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDados } from "../context/DataContext";
import { api } from "../services/api";

// Mesmas regras do firmware e do backend.
function validarLimites({ tensaoMin, tensaoMax, correnteMax }) {
  const erros = {};
  const vMin = Number(tensaoMin);
  const vMax = Number(tensaoMax);
  const iMax = Number(correnteMax);
  if (tensaoMin === "" || Number.isNaN(vMin)) erros.tensaoMin = "Informe a tensão mínima.";
  else if (vMin <= 0) erros.tensaoMin = "A tensão mínima deve ser maior que 0.";
  if (tensaoMax === "" || Number.isNaN(vMax)) erros.tensaoMax = "Informe a tensão máxima.";
  else if (vMax > 300) erros.tensaoMax = "A tensão máxima deve ser no máximo 300 V.";
  if (!erros.tensaoMin && !erros.tensaoMax && vMin >= vMax) {
    erros.tensaoMax = "A tensão máxima deve ser maior que a mínima.";
  }
  if (correnteMax === "" || Number.isNaN(iMax)) erros.correnteMax = "Informe a corrente máxima.";
  else if (iMax <= 0 || iMax > 30) erros.correnteMax = "A corrente máxima deve estar entre 0 e 30 A.";
  return erros;
}

function validarIntervalo(intervalo) {
  const ms = Number(intervalo);
  if (intervalo === "" || !Number.isInteger(ms)) return "Informe um número inteiro de milissegundos.";
  if (ms < 500 || ms > 60000) return "O intervalo deve estar entre 500 e 60000 ms (0,5 s a 60 s).";
  return null;
}

/** Formulários de limites de proteção e intervalo de envio. */
export default function Configuracao({ aoEnviarComando }) {
  const { dispositivo, leitura, recarregarLeitura } = useDados();
  const [limites, setLimites] = useState({ tensaoMin: "", tensaoMax: "", correnteMax: "" });
  const [intervalo, setIntervalo] = useState("");
  const [editado, setEditado] = useState({ limites: false, intervalo: false });
  const [erros, setErros] = useState({});
  const [resultado, setResultado] = useState({}); // { limites: {tipo, texto}, intervalo: {tipo, texto} }
  const [enviando, setEnviando] = useState(null);

  // Preenche com os valores atuais do ESP32 enquanto o usuário não começou a editar.
  const atual = leitura?.limites;
  useEffect(() => {
    if (!editado.limites && atual?.tensaoMin != null) {
      setLimites({ tensaoMin: String(atual.tensaoMin), tensaoMax: String(atual.tensaoMax), correnteMax: String(atual.correnteMax) });
    }
  }, [atual?.tensaoMin, atual?.tensaoMax, atual?.correnteMax, editado.limites]);

  useEffect(() => {
    if (!editado.intervalo && leitura?.intervaloMs != null) setIntervalo(String(leitura.intervaloMs));
  }, [leitura?.intervaloMs, editado.intervalo]);

  function alterarLimite(campo, valor) {
    setLimites((l) => ({ ...l, [campo]: valor }));
    setEditado((e) => ({ ...e, limites: true }));
  }

  async function enviarLimites(evento) {
    evento.preventDefault();
    const encontrados = validarLimites(limites);
    // Substitui os erros dos três campos (os que passaram ficam undefined e a mensagem some).
    setErros((e) => ({
      ...e,
      tensaoMin: encontrados.tensaoMin,
      tensaoMax: encontrados.tensaoMax,
      correnteMax: encontrados.correnteMax,
    }));
    if (Object.keys(encontrados).length > 0) return;

    setEnviando("limites");
    try {
      await api.alterarLimites(dispositivo, {
        tensaoMin: Number(limites.tensaoMin),
        tensaoMax: Number(limites.tensaoMax),
        correnteMax: Number(limites.correnteMax),
      });
      setResultado((r) => ({ ...r, limites: { tipo: "ok", texto: "Limites enviados ao ESP32." } }));
      setEditado((e) => ({ ...e, limites: false }));
      recarregarLeitura();
      aoEnviarComando?.();
    } catch (e) {
      if (e.campos) {
        // O backend chama a regra "mínima < máxima" de faixaDeTensaoValida; mostramos no campo da máxima.
        const { faixaDeTensaoValida, ...campos } = e.campos;
        setErros((atual) => ({ ...atual, ...campos, ...(faixaDeTensaoValida && { tensaoMax: faixaDeTensaoValida }) }));
      }
      setResultado((r) => ({ ...r, limites: { tipo: "erro", texto: e.message } }));
    } finally {
      setEnviando(null);
    }
  }

  async function enviarIntervalo(evento) {
    evento.preventDefault();
    const erro = validarIntervalo(intervalo);
    setErros((e) => ({ ...e, intervalo: erro }));
    if (erro) return;

    setEnviando("intervalo");
    try {
      await api.alterarIntervalo(dispositivo, Number(intervalo));
      setResultado((r) => ({ ...r, intervalo: { tipo: "ok", texto: "Intervalo enviado ao ESP32." } }));
      setEditado((e) => ({ ...e, intervalo: false }));
      recarregarLeitura();
      aoEnviarComando?.();
    } catch (e) {
      if (e.campos) setErros((atual) => ({ ...atual, ...e.campos }));
      setResultado((r) => ({ ...r, intervalo: { tipo: "erro", texto: e.message } }));
    } finally {
      setEnviando(null);
    }
  }

  const desabilitado = !dispositivo || !leitura;

  const campo = (nome, rotulo, unidade, passo) => (
    <label className="campo">
      <span>
        {rotulo} ({unidade})
      </span>
      <input
        type="number"
        step={passo}
        inputMode="decimal"
        value={limites[nome]}
        onChange={(e) => alterarLimite(nome, e.target.value)}
        aria-invalid={Boolean(erros[nome])}
        disabled={desabilitado}
      />
      {erros[nome] && <small className="erro-campo">{erros[nome]}</small>}
    </label>
  );

  return (
    <section className="painel configuracao">
      <h2>Configuração do dispositivo</h2>

      <form onSubmit={enviarLimites} noValidate>
        <h3>Limites de proteção</h3>
        <p className="nota">Fora destes limites o ESP32 dispara o alerta e desliga a carga.</p>
        <div className="campos">
          {campo("tensaoMin", "Tensão mínima", "V", "0.1")}
          {campo("tensaoMax", "Tensão máxima", "V", "0.1")}
          {campo("correnteMax", "Corrente máxima", "A", "0.1")}
        </div>
        <button type="submit" className="botao primario" disabled={desabilitado || enviando === "limites"}>
          {enviando === "limites" ? "Enviando…" : "Salvar limites"}
        </button>
        {resultado.limites && <p className={`mensagem ${resultado.limites.tipo}`}>{resultado.limites.texto}</p>}
      </form>

      <form onSubmit={enviarIntervalo} noValidate>
        <h3>Intervalo de envio</h3>
        <p className="nota">De quanto em quanto tempo o ESP32 publica uma leitura.</p>
        <div className="campos">
          <label className="campo">
            <span>Intervalo (ms)</span>
            <input
              type="number"
              step="100"
              inputMode="numeric"
              value={intervalo}
              onChange={(e) => {
                setIntervalo(e.target.value);
                setEditado((ed) => ({ ...ed, intervalo: true }));
              }}
              aria-invalid={Boolean(erros.intervalo)}
              disabled={desabilitado}
            />
            {erros.intervalo && <small className="erro-campo">{erros.intervalo}</small>}
          </label>
        </div>
        <button type="submit" className="botao primario" disabled={desabilitado || enviando === "intervalo"}>
          {enviando === "intervalo" ? "Enviando…" : "Salvar intervalo"}
        </button>
        {resultado.intervalo && (
          <p className={`mensagem ${resultado.intervalo.tipo}`}>{resultado.intervalo.texto}</p>
        )}
      </form>
    </section>
  );
}

Configuracao.propTypes = {
  aoEnviarComando: PropTypes.func,
};
