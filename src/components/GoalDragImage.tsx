import React from "react";
import {TreeGoal} from "./types.ts";

const GoalDragImageItem: React.FC<{goal: TreeGoal}> = ({goal}) => (
    <div className="p-2 bg-white border rounded shadow-sm">
        {goal.content}
    </div>
);

export const GoalDragImage = React.forwardRef<HTMLDivElement, {goal: TreeGoal}>(({goal}, ref) => (
    <div ref={ref} className="d-grid gap-1" style={{position: "fixed", top: "-1000px"}} aria-hidden="true">
        <GoalDragImageItem goal={goal}/>
    </div>
));

export const GoalDragImageGroup = React.forwardRef<HTMLDivElement, {goals: TreeGoal[]}>(({goals}, ref) => (
    <div ref={ref} className="d-grid gap-1" style={{position: "fixed", top: "-1000px"}} aria-hidden="true">
        {goals.map((goal) => <GoalDragImageItem key={goal.id} goal={goal}/>)}
    </div>
));
