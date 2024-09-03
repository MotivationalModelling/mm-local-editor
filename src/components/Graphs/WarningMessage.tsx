// WarningMessage.tsx
import React from "react";

// As in SectionPanel
type Goal = {
    GoalID: number;
    GoalType: string;
    GoalContent: string;
    SubGoals: Goal[];
  };
  
  type Cluster = {
    ClusterGoals: Goal[];
  };

type WarningMessageProps = {
  cluster: Cluster;
};

const WarningMessage: React.FC<WarningMessageProps> = ({ cluster }) => {
    /**
     * Check if goals list have functional goals
     */
    const hasFunctionalGoals = (cluster: Cluster): boolean => {
        for (const goal of cluster.ClusterGoals) {
        if (goal.GoalType === "Functional") {
            return true;
        }
        }
        return false;
    };

    // Determine whether to show the warning based on cluster
    const showWarning = cluster.ClusterGoals.length > 0 && !hasFunctionalGoals(cluster);

    if (!showWarning) return null; // Do not render anything if there is no need for a warning

    return (
        <div
            style={{
                position: "fixed",
                bottom: "10px",
                right: "10px",
                backgroundColor: "yellow",
                padding: "10px",
                borderRadius: "5px",
                zIndex: 5,
            }}
        >
            No functional goals found
        </div>
    );
};

export default WarningMessage;
