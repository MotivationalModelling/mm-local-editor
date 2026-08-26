import {describe, expect, it} from "vitest";

import {decorateTreeItems, stripTreeUiState} from "./Tree.tsx";
import {TreeGoal} from "./types.ts";

const collectDragIds = (items: ReturnType<typeof decorateTreeItems>): Array<string | number> => (
    items.flatMap((item) => [item.id, ...collectDragIds(item.children ?? [])])
);

describe("hierarchy drag identifiers", () => {
    it("uses instanceId so duplicate non-functional goal references remain independent", () => {
        const tree: TreeGoal[] = [{
            id: 1,
            instanceId: "1-1",
            type: "Do",
            content: "parent",
            children: [{
                id: 2,
                instanceId: "2-1",
                type: "Who",
                content: "student",
                children: [],
            }],
        }, {
            id: 2,
            instanceId: "2-2",
            type: "Who",
            content: "student",
            children: [],
        }];

        const sortableItems = decorateTreeItems(tree, new Set());

        expect(collectDragIds(sortableItems)).toEqual(["1-1", "2-1", "2-2"]);
        expect(new Set(collectDragIds(sortableItems)).size).toBe(3);
        expect(stripTreeUiState(sortableItems)).toEqual(tree);
    });
});
