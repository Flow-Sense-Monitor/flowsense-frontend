import PropTypes from "prop-types";
import { numero } from "../utils/formatacao";
import "../styles/Card.css";

/** Cartão com um valor medido. "estado" muda a cor: normal, alerta ou apagado (dado antigo). */
const Card = ({ titulo, valor, unidade, icone, casas = 1, detalhe, estado = "normal" }) => (
  <div className={`card card-${estado}`}>
    <div className="card-header">
      <span className="icone" aria-hidden="true">
        {icone}
      </span>
      <h2>{titulo}</h2>
    </div>
    <div className="card-valor">
      {typeof valor === "number" ? (
        <span className="numero">{numero(valor, casas)}</span>
      ) : (
        <span className="numero texto">{valor ?? "—"}</span>
      )}
      {unidade && <span className="unidade">{unidade}</span>}
    </div>
    {detalhe && <p className="card-detalhe">{detalhe}</p>}
  </div>
);

Card.propTypes = {
  titulo: PropTypes.string.isRequired,
  valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  unidade: PropTypes.string,
  icone: PropTypes.string.isRequired,
  casas: PropTypes.number,
  detalhe: PropTypes.node,
  estado: PropTypes.oneOf(["normal", "alerta", "ok", "apagado"]),
};

export default Card;
