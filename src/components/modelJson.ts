import {z} from "zod";
import type {InstanceId, Label, TabContent, TreeGoal} from "./types.ts";
import {normalizeInstanceId, parseInstanceId} from "./utils/InstanceId";

const labels = ["Do", "Be", "Feel", "Concern", "Who"] as const;

const LabelSchema = z.enum(labels);

const InstanceIdSchema = z.string().transform((value, context) => {
    try {
        return normalizeInstanceId(value);
    } catch {
        context.addIssue({code: z.ZodIssueCode.custom, message: `Invalid instanceId "${value}"`, fatal: true});
        return z.NEVER;
    }
});

const TreeGoalSchema: z.ZodType<TreeGoal, z.ZodTypeDef, unknown> = z.lazy(() => z.object({
    id: z.number().int(),
    content: z.string(),
    type: LabelSchema,
    instanceId: InstanceIdSchema,
    children: z.array(TreeGoalSchema).optional(),
    color: z.string().optional(),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
}));

const TabContentSchema: z.ZodType<TabContent> = z.object({
    label: LabelSchema,
    icon: z.string(),
    goalIds: z.array(z.number().int()),
});

// Optional presentation data; legacy files continue to use automatic layout.
const NonFunctionalLayoutSchema = z.record(z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
}));
export type NonFunctionalLayout = z.infer<typeof NonFunctionalLayoutSchema>;

export const ModelJsonSchema = z.object({
    tabData: z.array(TabContentSchema),
    treeData: z.array(TreeGoalSchema),
    nonFunctionalLayout: NonFunctionalLayoutSchema.optional(),
}).superRefine(({tabData, treeData}, context) => {
    const tabsByLabel = new Map<Label, TabContent>();
    const labelByGoalId = new Map<number, Label>();


    // TabData: Check duplicate label and goalIds
    tabData.forEach((tab, tabIndex) => {
        if (tabsByLabel.has(tab.label)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["tabData", tabIndex, "label"],
                message: `duplicate tab label "${tab.label}"`,
            });
        }
        tabsByLabel.set(tab.label, tab);

        tab.goalIds.forEach((goalId, goalIndex) => {
            const existingLabel = labelByGoalId.get(goalId);
            if (existingLabel !== undefined) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["tabData", tabIndex, "goalIds", goalIndex],
                    message: `goal ID ${goalId} is already listed in the ${existingLabel} tab`,
                });
            } else {
                labelByGoalId.set(goalId, tab.label);
            }
        });
    });

    labels.forEach((label) => {
        if (!tabsByLabel.has(label)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["tabData"],
                message: `missing required "${label}" tab`,
            });
        }
    });


    // TreeData: id and type has to be consistent with TabData
    const instanceIds = new Set<InstanceId>();
    const validateTree = (goals: TreeGoal[], path: (string | number)[]) => {
        goals.forEach((goal, index) => {
            const goalPath = [...path, index];
            const tabLabel = labelByGoalId.get(goal.id);

            if (tabLabel === undefined) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [...goalPath, "id"],
                    message: `goal ID ${goal.id} is not listed in tabData`,
                });
            } else if (tabLabel !== goal.type) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [...goalPath, "type"],
                    message: `goal ID ${goal.id} is listed in the ${tabLabel} tab but has type ${goal.type}`,
                });
            }

            // instance id has to match id
            const instanceGoalId = parseInstanceId(goal.instanceId).goalId;
            if (instanceGoalId !== goal.id) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [...goalPath, "instanceId"],
                    message: `instanceId ${goal.instanceId} does not match goal ID ${goal.id}`,
                });
            }

            if (instanceIds.has(goal.instanceId)) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [...goalPath, "instanceId"],
                    message: `duplicate instanceId "${goal.instanceId}"`,
                });
            }
            instanceIds.add(goal.instanceId);

            validateTree(goal.children ?? [], [...goalPath, "children"]);
        });
    };

    validateTree(treeData, ["treeData"]);
});

export type JSONData = z.infer<typeof ModelJsonSchema>;

export class ModelJsonError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ModelJsonError";
    }
}

// The tree owns placement and instance IDs; goals owns the latest text/type.
// Build an export-only snapshot so every occurrence of a goal gets its current
// content without changing the live hierarchy or duplicating editor state.
const snapshotTreeForSave = (
    tree: readonly TreeGoal[],
    goals: Readonly<Record<number, TreeGoal>>,
): TreeGoal[] => tree.map(node => {
    const goal = goals[node.id];
    if (!goal) {
        throw new ModelJsonError(`Cannot save: goal ${node.id} is missing from the model.`);
    }
    return {
        ...node,
        content: goal.content,
        type: goal.type,
        ...(node.children ? {children: snapshotTreeForSave(node.children, goals)} : {}),
    };
});

export const createModelJson = (
    tabData: TabContent[],
    treeData: TreeGoal[],
    goals: Readonly<Record<number, TreeGoal>>,
    nonFunctionalLayout?: NonFunctionalLayout,
): JSONData => {
    // Apply the same validation/normalization on save and open. An invalid
    // snapshot must fail before the file picker can overwrite an existing file.
    return validateModelJson({tabData, treeData: snapshotTreeForSave(treeData, goals), nonFunctionalLayout});
};

const formatSchemaError = (error: z.ZodError): string => {
    const issue = error.issues[0];
    const location = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${location}${issue.message}`;
};

const validateModelJson = (value: unknown): JSONData => {
    const result = ModelJsonSchema.safeParse(value);
    if (!result.success) {
        throw new ModelJsonError(
            `The JSON is not a valid AMMBER model. ${formatSchemaError(result.error)}`
        );
    }
    return result.data;
};

export const parseModelJson = (fileContent: string): JSONData => {
    if (fileContent.trim() === "") {
        throw new ModelJsonError("The selected file is empty.");
    }

    let parsedData: unknown;
    try {
        parsedData = JSON.parse(fileContent);
    } catch {
        throw new ModelJsonError("The selected file does not contain valid JSON.");
    }

    return validateModelJson(parsedData);
};
