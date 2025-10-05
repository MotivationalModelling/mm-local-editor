import { Graph, InternalEvent } from '@maxgraph/core';
import { SYMBOL_CONFIGS, SymbolKey } from './GraphConstants';
import { update } from 'idb-keyval';

// Finds the symbol key (e.g. 'STAKEHOLDER') based on the type
export function getSymbolKeyByType(type: string): SymbolKey | undefined {
  return (Object.entries(SYMBOL_CONFIGS) as [SymbolKey, typeof SYMBOL_CONFIGS[SymbolKey]][])
    .find(([_, config]) => config.type === type)?.[0];
}

// Utility function to return focus to graph container
// This enables keyboard shortcuts after save/export operations
export const returnFocusToGraph = () => {
    const graphContainer = document.getElementById('graphContainer');
    if (graphContainer) {
        graphContainer.focus();
    }
};

// Keep the in-place text editor at correct position 
export function fixEditorPosition(graph: Graph) {
    const container = graph.container as HTMLElement;
    container.style.position = 'relative';
    
    // Apply the correct position to the text editor element
    const updateEditor = (el: HTMLElement) => {
        el.style.position = 'absolute';
        el.style.transformOrigin = '0 0';
        el.style.zIndex = '10';
        if (el.parentElement !== container) {
          container.appendChild(el);
        }
    };

    const findEditorEl = (): HTMLElement | null => {
        return (
          container.querySelector('.mxCellEditor') ||
          document.querySelector('.mxCellEditor')
        ) as HTMLElement | null;
    };

    const adjustOnce = () => {
        const el = findEditorEl();
        if (el) updateEditor(el);
    };

    const observer = new MutationObserver(() => adjustOnce());
    observer.observe(container, { childList: true, subtree: true });
};
