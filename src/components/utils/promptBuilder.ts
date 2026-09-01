import {ExtractedModel} from "./modelExtractor";

const formatList = (items: string[]): string => {
  if (items.length === 0) return "- (none)";
  return items.map((i) => `- ${i}`).join("\n");
};

export function buildUserStoryPrompt(model: ExtractedModel): string {
  const storyLines = model.stories.flatMap((s, index) => [
    `Story ${index + 1}:`,
    `  Functional goal: ${s.story}`,
    `  Role: ${s.roles.join(", ")}`,
    `  Quality goals: ${s.qualityGoals.join(", ")}`,
    `  Emotional goals: ${s.emotionalGoals.join(", ")}`,
    ``,
  ]);

  return [
    `EXAMPLE INPUT:`,
    `System: Real estate marketplace`,
    `Stories to generate:`,
    `Story 1:`,
    `  Functional goal: Browse and search properties`,
    `  Role: Buyer`,
    `  Quality goals: Easy to use`,
    `  Emotional goals: Confident`,
    ``,
    `Story 2:`,
    `  Functional goal: Sell properties`,
    `  Role: Seller`,
    `  Quality goals: Professional`,
    `  Emotional goals: Proud`,
    ``,
    `EXAMPLE OUTPUT:`,
    `As a Buyer, I want to browse and search properties so that the process is easy to use. I want to feel confident.`,
    ``,
    `As a Seller, I want to sell properties so that the platform feels professional. I want to feel proud.`,
    `END OF EXAMPLE`,
    ``,
    `Now generate user stories for this model:`,
    ``,
    `System: ${model.epic}`,
    ``,
    `Concerns:`,
    formatList(model.concerns),
    ``,
    `As a <role>, I want to <functional goal> so that <quality goal>. I want to feel <emotional goal>.`,
    ``,
    `Generate exactly one user story for each Story entry.`,
    `For each story, use only its own Role, Quality goals, and Emotional goals.`,
    `Do NOT use context from another Story entry.`,
    `If a field is blank, leave that part of the user story blank.`,
    `Do NOT invent requirements not in the model.`,
    `Do NOT rename the system.`,
    `Do NOT add roles, quality goals, or emotional goals not listed for that story.`,
    `If you make an assumption, prefix it with "ASSUMPTION:"`,
    `Return ONLY the user stories, no explanation, no preamble.`,
    ``,
    `Stories to generate:`,
    ...(storyLines.length > 0 ? storyLines : ["(none)"]),
  ].join("\n");
}
