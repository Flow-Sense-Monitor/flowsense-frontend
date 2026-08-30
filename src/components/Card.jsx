import { useContext } from "react";
import { DataContext } from "../context/DataContext";
import "../styles/Card.css";

const Card = ({ titulo, valor, unidade, icone }) => {
  const { connected } = useContext(DataContext);

  return (
    <div className={`card ${connected ? "connected" : "disconnected"}`}>
      <div className="card-header">
        <span className="icone">{icone}</span>
        <h2>{titulo}</h2>
      </div>
      <div className="card-valor">
        <span className="numero">{valor.toFixed(2)}</span>
        <span className="unidade">{unidade}</span>
      </div>
    </div>
  );
};

export default Card;
