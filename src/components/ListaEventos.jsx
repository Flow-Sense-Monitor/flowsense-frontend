import PropTypes from "prop-types";
import { dataHora, numero } from "../utils/formatacao";

const ESTILO_EVENTO = {
  SOBRETENSAO: { icone: "⚠", classe: "alerta", nome: "Sobretensão" },
  SUBTENSAO: { icone: "⚠", classe: "alerta", nome: "Subtensão" },
  SOBRECORRENTE: { icone: "⚠", classe: "alerta", nome: "Sobrecorrente" },
  ALERTA_ENCERRADO: { icone: "✔", classe: "ok", nome: "Normalizado" },
  ONLINE: { icone: "●", classe: "ok", nome: "Online" },
  OFFLINE: { icone: "●", classe: "erro", nome: "Offline" },
  COMANDO_RELE: { icone: "➜", classe: "comando", nome: "Comando" },
  COMANDO_LIMITES: { icone: "➜", classe: "comando", nome: "Comando" },
  COMANDO_INTERVALO: { icone: "➜", classe: "comando", nome: "Comando" },
};

/** Alertas e eventos, mais recentes primeiro. */
export default function ListaEventos({ eventos, erro, carregando }) {
  return (
    <section className="painel">
      <h2>Alertas e eventos</h2>
      {erro && !eventos && <p className="vazio">Não foi possível carregar os eventos.</p>}
      {carregando && !eventos && <p className="vazio">Carregando…</p>}
      {eventos && eventos.length === 0 && <p className="vazio">Nenhum evento registrado ainda.</p>}
      {eventos && eventos.length > 0 && (
        <ul className="eventos">
          {eventos.map((ev) => {
            const estilo = ESTILO_EVENTO[ev.tipo] ?? { icone: "•", classe: "", nome: ev.tipo };
            return (
              <li key={ev.id} className={`evento evento-${estilo.classe}`}>
                <span className="evento-icone" aria-hidden="true">
                  {estilo.icone}
                </span>
                <div className="evento-texto">
                  <div>
                    <strong>{estilo.nome}</strong> — {ev.descricao}
                  </div>
                  <small>
                    {dataHora(ev.momento)}
                    {ev.tensao != null && ` · ${numero(ev.tensao)} V`}
                    {ev.corrente != null && ` · ${numero(ev.corrente, 2)} A`}
                    {ev.rele && ` · relé ${ev.rele === "ON" ? "ligado" : "desligado"}`}
                  </small>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

ListaEventos.propTypes = {
  eventos: PropTypes.array,
  erro: PropTypes.object,
  carregando: PropTypes.bool,
};
