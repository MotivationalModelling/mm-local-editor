import {ExtractedModel} from "./modelExtractor";

export function buildUserStoryPrompt(model: ExtractedModel, projectBackground: string): string {
  const normalizedProjectBackground = projectBackground.trim();
  if (normalizedProjectBackground.length === 0) {
    throw new Error("Project background is required to generate user stories.");
  }

  const functionalGoals = model.stories.map((story) => ({
    functionalGoalInstanceId: story.functionalGoalInstanceId,
    "Functional goal": story.story,
    "Roles List": story.roles,
    "Quality goals": story.qualityGoals,
    "Emotional goals": story.emotionalGoals,
    Concerns: story.concerns,
    relatedGoalInstanceIds: story.goalReferences.map((goal) => goal.instanceId),
  }));

  return `You are generating Agile user stories for a software project from a Motivational Model.

You will be given a project background and a set of functional goals.

Generate exactly one user story for each functional goal.

Each functional goal corresponds to exactly one user story.
If a functional goal has multiple roles, include all of those roles in the same user story.

Each functional goal may include:
- Roles: represent stakeholders who are relevant to the functional goal.
- Quality goals: describe desirable qualities of the interaction, process, or outcome.
- Emotional goals: describe how stakeholders want to feel or perceive the interaction.
- Concerns: provide additional contextual information relevant to the functional goal.

GROUNDING RULES:

- Use only the information provided for the current functional goal and the project background.
- Do not invent requirements, functionality, stakeholders, goals, or constraints that are not supported by the provided information.
- Do not use roles, quality goals, emotional goals, or concerns from another functional goal.
- Do not introduce assumptions unless they are necessary to make the sentence grammatical.
- Preserve the original meaning and scope of the functional goal.


USER STORY FORMAT

Each user story must follow this format:

As a <role>, I want to <functional goal> so that <immediate user value>.

STEPS TO GENERATE USER STORIES:

STEP 1: INCLUDE THE ROLES

Include all roles associated with the current functional goal in the user story.

- Use every role exactly as written in the provided Roles List.
- Do not select, omit, invent, rename, generalise, or merge roles.
- If multiple roles are provided, include all of them in the same user story.
- If no roles are provided, use "user".


STEP 2: EXPRESS THE FUNCTIONAL GOAL

Use the provided functional goal as the action after "I want to".

- You may make minor grammatical changes so that it reads naturally after "I want to".
- The words "I want to" are mandatory in every sentence, followed by a base-form action verb.
- If the functional goal is a noun phrase, convert it into an action while preserving its meaning and scope. Preserve the meaning, not necessarily the exact wording.
- For example, "AI support question checking" becomes "I want to check questions with AI support", not "I want AI support question checking".
- For example, "View leaderboard" becomes "I want to view the leaderboard", not "I want a leaderboard".
- These examples illustrate grammar only; do not add their functionality to unrelated goals.
- Do not add new functionality.


STEP 3: GENERATE THE IMMEDIATE USER VALUE

Generate the smallest and most direct user value that follows from performing the functional goal.

To determine the immediate user value:

1. Consider the project background.
2. Consider the selected role and the functional goal.
3. Consider the relevant quality goals, emotional goals, and concerns as supporting context.
4. Ask: "Why would this role want to perform this action?"
5. Identify the most immediate user outcome supported by the provided information.

The immediate user value must:

- describe a direct benefit or outcome of the functional goal;
- be relevant to the selected role;
- remain consistent with the project background;
- be supported by the provided functional goal and its related context;
- not introduce new functionality or requirements;
- not speculate about downstream or long-term benefits when a more immediate value is available.
- Concerns may be used to understand the context, but do not need to be explicitly expressed in the user story.


STEP 4: INCORPORATE QUALITY AND EMOTIONAL GOALS

Consider all quality goals and emotional goals associated with the current functional goal.

Where they can be expressed naturally and without changing the meaning of the functional goal:

- incorporate quality goals as appropriate modifiers of the action, interaction, or outcome;
- incorporate emotional goals as appropriate descriptions of how the stakeholder experiences or perceives the interaction or outcome.

Do not force a quality goal or emotional goal into the sentence if doing so would make the sentence unnatural, change the original intent, or introduce unsupported meaning.

Do not create additional functionality merely to express a quality goal or emotional goal.


STEP 5: VALIDATE THE USER STORY

Before returning the story, check that:

- the role matches exactly to the current functional goal's Roles List;
- the functional goal preserves the original action and scope;
- the immediate user value is directly supported by the provided information;
- no unsupported requirement or functionality has been introduced;
- the sentence is grammatically correct and fluent;
- every sentence contains the exact connector ", I want to " followed by an action, and " so that " followed by a non-empty benefit;
- the sentence follows:
  "As a <role>, I want to <functional goal> so that <immediate user value>."


REQUIRED OUTPUT FORMAT

Return one JSON object with a "stories" array.

Each array item must have this shape:

{
  "functionalGoalInstanceId": "<provided Do instanceId>",
  "sentence": "As a <role>, I want to <functional goal> so that <immediate user value>.",
  "relatedGoalInstanceIds": ["<instanceId>"]
}

Return exactly one array item per functional goal.
Copy \`functionalGoalInstanceId\` and \`relatedGoalInstanceIds\` exactly from the input into the corresponding output item without modification.


MODEL INPUT

System:
${normalizedProjectBackground}

Functional goals:
${JSON.stringify(functionalGoals, null, 2)}


Return only the JSON object without Markdown fences or additional text.`;
}
