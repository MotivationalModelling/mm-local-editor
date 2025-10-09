import { ClusterGoal } from '../types';
import { SYMBOL_CONFIGS, SymbolKey } from './GraphConstants';

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

// Functional-8-1
export function formatFunGoalRefId(goal: ClusterGoal): string {
    return `${goal.GoalType}-${goal.instanceId}`;
}

// Convert the cell id in MaxGraph 'Functional-8-1'
export function parseFunGoalRefId(idStr: string) {
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
    return { type, goalId, instanceId };
}

// Treeid stored in the state '8-1'
export function parseGoalRefId(instanceId: string) {
    const parts = instanceId.split("-");
    const suffixStr = parts.pop();
    return Number(suffixStr);
}