import { useContext, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { DataContext } from "../context/DataContext";

export const useWebSocket = (url = "ws://localhost:8080/ws") => {
  const { updateData, setConnected } = useContext(DataContext);
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: url,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("✅ Conectado");
        setConnected(true);

        // Subscrever no tópico
        client.subscribe("/topic/leituras", (message) => {
          try {
            const leitura = JSON.parse(message.body);
            updateData(leitura);
          } catch (error) {
            console.error("Erro ao processar mensagem:", error);
          }
        });
      },

      onDisconnect: () => {
        console.log("❌ Desconectado");
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error("Erro:", frame.headers["message"]);
        setConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      if (clientRef.current && clientRef.current.active) {
        clientRef.current.deactivate();
      }
    };
  }, [updateData, setConnected, url]);
};
