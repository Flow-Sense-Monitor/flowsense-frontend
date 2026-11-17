import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Busca dados periodicamente (polling).
 *
 * @param buscar     função que devolve uma Promise com os dados
 * @param intervaloMs de quanto em quanto tempo buscar de novo
 * @param chave      quando muda (ex.: outro período no gráfico), busca na hora
 *
 * Em caso de erro, mantém os últimos dados recebidos e expõe o erro, para a tela
 * poder mostrar "servidor fora do ar" sem apagar os valores.
 */
export function usePolling(buscar, intervaloMs, chave = "") {
  const [estado, setEstado] = useState({ dados: null, erro: null, carregando: true });
  const [versao, setVersao] = useState(0);
  const buscarRef = useRef(buscar);

  useEffect(() => {
    buscarRef.current = buscar;
  });

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    let ativo = true; // evita gravar a resposta de uma busca antiga depois que a chave mudou

    async function executar() {
      try {
        const dados = await buscarRef.current();
        if (ativo) setEstado({ dados, erro: null, carregando: false });
      } catch (erro) {
        if (ativo) setEstado((anterior) => ({ dados: anterior.dados, erro, carregando: false }));
      }
    }

    executar();
    const timer = setInterval(executar, intervaloMs);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [intervaloMs, chave, versao]);

  return { ...estado, recarregar };
}
