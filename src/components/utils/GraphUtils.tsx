import { SYMBOL_CONFIGS, SymbolKey, SymbolConfig } from './GraphConstants';

// Finds the symbol key (e.g. 'STAKEHOLDER') based on the type
export function getSymbolKeyByType(type: string): SymbolKey | undefined {
  return (Object.entries(SYMBOL_CONFIGS) as [SymbolKey, typeof SYMBOL_CONFIGS[SymbolKey]][])
    .find(([_, config]) => config.type === type)?.[0];
}

// --- Utility Functions ---
export const getSymbolConfigByShape = (shape: string): SymbolConfig | undefined => {
  return Object.values(SYMBOL_CONFIGS).find(config => config.shape === shape);
};

// Utility function to return focus to graph container
// This enables keyboard shortcuts after save/export operations
export const returnFocusToGraph = () => {
    const graphContainer = document.getElementById('graphContainer');
    if (graphContainer) {
        graphContainer.focus();
    }
};
