import React, { createContext, useContext, useState } from "react";
import { Graph } from "@maxgraph/core";

// Define the types for the context
type GraphContextType = {
  graph: Graph | null;
  setGraph: (graph: Graph | null) => void;
};

// Define the props for the GraphProvider
type GraphContextProps = { children: React.ReactNode };

// Create a context with default values
const GraphContext = createContext<GraphContextType>({
  graph: null,
  setGraph: () => {},
});

// Custom hook to use the GraphContext
export const useGraph = () => useContext(GraphContext);

// GraphProvider component to provide the GraphContext to its children
export const GraphProvider: React.FC<GraphContextProps> = ({ children }) => {
  const [graph, setGraph] = useState<Graph | null>(null);

  return (
    <GraphContext.Provider value={{ graph, setGraph }}>
      {children}
    </GraphContext.Provider>
  );
};