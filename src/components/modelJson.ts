import {z} from "zod";
import type {InstanceId, Label, TabContent, TreeGoal} from "./types.ts";
import {INSTANCE_ID_SEPARATOR, readInstanceId} from "./instanceId.ts";

const labels = ["Do", "Be", "Feel", "Concern", "Who"] as const;

const LabelSchema = z.enum(labels);

const InstanceIdSchema = z.custom<InstanceId>(
    // Imported files may predate the separator change, so the legacy spelling is
    // allowed through here and normalizeInstanceId() upgrades it on the way into state
    (value) => readInstanceId(value, {acceptLegacy: true}) !== null,
    `instanceId must be two numbers separated by "${INSTANCE_ID_SEPARATOR}", e.g. "12${INSTANCE_ID_SEPARATOR}1"`
);

const TreeGoalSchema: z.ZodType<TreeGoal> = z.lazy(() => z.object({
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

export const ModelJsonSchema = z.object({
    tabData: z.array(TabContentSchema),
    treeData: z.array(TreeGoalSchema),
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
    const instanceIds = new Set<string>();
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
            const instanceIdParts = readInstanceId(goal.instanceId, {acceptLegacy: true});
            if (instanceIdParts !== null && instanceIdParts.goalId !== goal.id) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [...goalPath, "instanceId"],
                    message: `instanceId ${goal.instanceId} does not match goal ID ${goal.id}`,
                });
            }

            // Compare on the canonical spelling so a legacy and a current ID for the
            // same instance are still recognised as duplicates
            const canonicalInstanceId = (instanceIdParts === null)
                ? goal.instanceId
                : `${instanceIdParts.goalId}${INSTANCE_ID_SEPARATOR}${instanceIdParts.refId}`;

            if (instanceIds.has(canonicalInstanceId)) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [...goalPath, "instanceId"],
                    message: `duplicate instanceId "${goal.instanceId}"`,
                });
            }
            instanceIds.add(canonicalInstanceId);

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

const formatSchemaError = (error: z.ZodError): string => {
    const issue = error.issues[0];
    const location = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${location}${issue.message}`;
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

    const result = ModelJsonSchema.safeParse(parsedData);
    if (!result.success) {
        throw new ModelJsonError(
            `The JSON is not a valid AMMBER model. ${formatSchemaError(result.error)}`
        );
    }

    return result.data;
};
