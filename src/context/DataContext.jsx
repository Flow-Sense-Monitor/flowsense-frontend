import React, { createContext, useState, useCallback } from "react";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    tensao: 0,
    corrente: 0,
    potencia: 0,
  });

  const [connected, setConnected] = useState(false);

  const updateData = useCallback((newData) => {
    const { tensao, corrente } = newData;
    const potencia = (tensao * corrente) / 1000; // kW

    setData({
      tensao: parseFloat(tensao.toFixed(2)),
      corrente: parseFloat(corrente.toFixed(2)),
      potencia: parseFloat(potencia.toFixed(2)),
    });
  }, []);

  return (
    <DataContext.Provider value={{ data, updateData, connected, setConnected }}>
      {children}
    </DataContext.Provider>
  );
};
