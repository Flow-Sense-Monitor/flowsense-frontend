import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { api } from "../services/api";
import { usePolling } from "../hooks/usePolling";
import { situacaoDispositivo } from "../utils/formatacao";

const DataContext = createContext(null);

const ATUALIZAR_LEITURA_MS = 2000;
const ATUALIZAR_DISPOSITIVOS_MS = 5000; // também define em quanto tempo a tela se recupera se o servidor cair

/**
 * Estado compartilhado do dashboard: dispositivo escolhido, leitura atual (a cada 2 s)
 * e se o servidor está respondendo.
 */
export function DataProvider({ children }) {
  const dispositivos = usePolling(api.dispositivos, ATUALIZAR_DISPOSITIVOS_MS);
  const [escolhido, setEscolhido] = useState(null);
  const dispositivo = escolhido ?? dispositivos.dados?.[0]?.id ?? null;

  const leitura = usePolling(
    () => (dispositivo ? api.leituraAtual(dispositivo) : Promise.resolve(null)),
    ATUALIZAR_LEITURA_MS,
    dispositivo ?? "",
  );

  // Relógio da tela: faz "há X s" e a detecção de "parou de mandar dados" se atualizarem sozinhos.
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const erro = leitura.erro ?? dispositivos.erro;
  const servidorFora = Boolean(erro?.servidorIndisponivel);
  // 404 na leitura atual = dispositivo configurado que ainda não mandou nada.
  const dadosLeitura = leitura.erro?.status === 404 ? null : leitura.dados;

  const valor = {
    dispositivos: dispositivos.dados ?? [],
    dispositivo,
    setDispositivo: setEscolhido,
    leitura: dadosLeitura,
    situacao: situacaoDispositivo(dadosLeitura, agora),
    carregando: dispositivos.carregando || (dispositivo !== null && leitura.carregando),
    servidorFora,
    erro,
    agora,
    recarregarLeitura: leitura.recarregar,
  };

  return <DataContext.Provider value={valor}>{children}</DataContext.Provider>;
}

DataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useDados() {
  return useContext(DataContext);
}
