
export type Label = "Do" | "Be" | "Feel" | "Concern" | "Who";

export interface TreeItem {
  id: number;
  content: string;
  type: Label;
  instanceId: string;
  children?: TreeItem[];
}

export interface TreeNode {
  goalId: TreeItem["id"];
  instanceId: TreeItem["instanceId"];
  children?: TreeNode[];
}

export interface TabContent {
  label: Label;
  icon: string;
  goalIds: number[];
}

export const newTreeItem = (
  initFields: Pick<TreeItem, "type"> & Partial<TreeItem>
): TreeItem => {
  const id = initFields.id ?? Date.now();
  const instanceId = initFields.instanceId ?? `${id}-0`;
  return {
    id,
    content: "",
    instanceId,
    ...initFields,
  };
};
