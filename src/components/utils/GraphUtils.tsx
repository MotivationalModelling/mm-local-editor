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
export function formatGoalTag(goal:ClusterGoal): string {
    return `${goal.GoalType}-${goal.instanceId}`;
}

// covert the cell id in maxgraph
export function parseCellId(idStr: string) {
  if (!idStr) {
    console.warn("parseCellId: missing cellId");
    return { type: "unknown", goalId: -1, instanceId: "unknown" };
  }

  const parts = idStr.split("-");
  if (parts.length < 3) {
    console.warn(`parseCellId: unexpected cellId format "${idStr}"`);
    return { type: "invalid", goalId: -1, instanceId: "invalid" };
  }

  const type = parts[0].trim();         // first part = goal type
  const goalId = Number(parts[1].trim()); // second part = goal ID
  if (isNaN(goalId)) {
    console.warn(`parseCellId: goalId is not a number in "${idStr}"`);
    return { type, goalId: -1, instanceId: "invalid" };
  }

  const instanceId = parts.slice(1).join("-"); // everything after type
  return { type, goalId, instanceId };
}

export function parseInstanceId(instanceId: string) {
  const parts = instanceId.split("-");
  const suffixStr = parts.pop();
  return Number(suffixStr);
}