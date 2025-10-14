import {ClusterGoal} from '../types';
import {SYMBOL_CONFIGS, SymbolKey, SymbolConfig} from './GraphConstants';
import {Graph, InternalEvent, Cell} from '@maxgraph/core';

// Finds the symbol key (e.g. 'STAKEHOLDER') based on the type
export function getSymbolKeyByType(type: string): SymbolKey | undefined {
    return (Object.entries(SYMBOL_CONFIGS) as [SymbolKey, typeof SYMBOL_CONFIGS[SymbolKey]][])
        .find(([_, config]) => config.type === type)?.[0];
}

export const getSymbolConfigByShape = (shape: string): SymbolConfig | undefined => {
    return Object.values(SYMBOL_CONFIGS).find(config => config.shape === shape);
};

/**
 * Extracts ID strings from a cell:
 * - Supports multiple comma-separated IDs like: "Functional-123-1,123-2,123-3"
 * - Returns an array of strings, e.g. ["123-1", "123-2", "123-3"]
 */
export function getCellNumericIds(cell: Cell): string[] {
    const cellId = cell.getId();
    if (cellId) {
        const match = cellId.match(/^(Functional|Nonfunctional)-(.+)$/);
        if (match) {
        return match[2]
            .split(",")
            .map(s => s.trim())
        }
    }
    return [];
}

// Utility function to return focus to graph container
// This enables keyboard shortcuts after save/export operations
export const returnFocusToGraph = () => {
    const graphContainer = document.getElementById('graphContainer');
    if (graphContainer) {
        graphContainer.focus();
    }
};

/**
 * Keeps the inline text editor at the center of the cell.
 * Uses a MutationObserver to detect when `.mxCellEditor` is added to the DOM,
 * then adjusts its position and keyboard behavior (Enter = save)
 * without modifying mxGraph’s internal event listeners.
 */
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

        // Press "Enter" to save editing
        el.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();     // prevent press Enter to start a newline
                graph.stopEditing(false);
            }
        });
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

// Functional-8-1
export function formatFunGoalRefId(goal: ClusterGoal): string {
    return `${goal.GoalType}-${goal.instanceId}`;
}

// Convert the cell id in MaxGraph 'Functional-8-1'
export function parseFuncGoalRefId(idStr: string) {
    if (!idStr) throw new Error("Cell ID is missing.");

    const parts = idStr.split("-");
    if (parts.length < 3) {
        throw new Error(`Cell ID format is invalid: expected format "Type-GoalId-InstanceId", got "${idStr}".`);
    }

    const type = parts[0].trim();
    const goalId = Number(parts[1].trim());
    if (isNaN(goalId)) {
        throw new Error(`Goal ID must be a number, got "${parts[1]}".`);
    }

    const instanceId = parts.slice(1).join("-");
    return {type, goalId, instanceId};
}

// Treeid stored in the state '8-1'
export function parseGoalRefId(instanceId: string) {
    const parts = instanceId.split("-");
    const suffixStr = parts.pop();
    return Number(suffixStr);
}
export const generateFunctionalCellId = (goal: ClusterGoal): string => {
    if (goal.GoalType === 'Functional'){
        return goal.GoalType + "-" + goal.GoalID;
    } else {
        throw new Error("Functional goal expected");
    }
};

export const generateNonFunctionalCellId = (ids: number[]): string => {
    return "Nonfunctional-" + ids.join(",");
};

export const parseInstanceId = (instanceId: string) => {
    const bits = instanceId.split("-").map(s => s.trim());
    // TODO: raise an exception here if bits.length > 2
    return {
        goalId: Number(bits[0]),
        refId: bits.length > 1 ? Number(bits[1]) : undefined
    };
};
