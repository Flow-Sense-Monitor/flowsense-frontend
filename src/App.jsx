import { useContext } from "react";
import { DataContext } from "./context/DataContext";
import Card from "./components/Card";
import "./styles/Dashboard.css";

function App() {
  const { data, connected } = useContext(DataContext);

  return (
    <div className="dashboard">
      <header className="header">
        <h1>⚡ FlowSense</h1>
        <div className={`status ${connected ? "on" : "off"}`}>
          {connected ? "🟢 Conectado" : "🔴 Desconectado"}
        </div>
      </header>

      <main className="cards-container">
        <Card titulo="Tensão" valor={data.tensao} unidade="V" icone="⚡" />
        <Card titulo="Corrente" valor={data.corrente} unidade="A" icone="🔌" />
        <Card titulo="Potência" valor={data.potencia} unidade="kW" icone="💡" />
      </main>
    </div>
  );
}

export default App;
