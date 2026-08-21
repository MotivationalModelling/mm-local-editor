import {ExtractedModel} from "./modelExtractor";

const formatList = (items: string[]): string => {
  if (items.length === 0) return "- (none)";
  return items.map((i) => `- ${i}`).join("\n");
};

export function buildUserStoryPrompt(model: ExtractedModel): string {
  const storyLines = model.stories.map((s) => {
    const subTasks = s.subTasks.length > 0 ? s.subTasks.join(", ") : "(none)";
    return `  - ${s.story} (sub-tasks: ${subTasks})`;
  });

  return [
    `EXAMPLE INPUT:`,
    `System: Real estate marketplace`,
    `Roles: Buyer, Seller`,
    `Quality goals: Easy to use, Professional, Secure`,
    `Emotional goals: Confident, Proud`,
    `Stories to generate:`,
    `  - Browse and search properties (sub-tasks: look up keywords, browse listings, contact seller)`,
    `  - Sell properties (sub-tasks: create listing, modify listing, decline order)`,
    ``,
    `EXAMPLE OUTPUT:`,
    `As a Buyer, I want to browse and search properties so that the process is easy to use. I want to feel confident.`,
    `  - Look up items using keywords`,
    `  - Browse listings`,
    `  - Contact a seller`,
    ``,
    `As a Seller, I want to sell properties so that the platform feels professional. I want to feel proud.`,
    `  - Create a listing`,
    `  - Modify a listing`,
    `  - Decline an order`,
    `END OF EXAMPLE`,
    ``,
    `Now generate user stories for this model:`,
    ``,
    `System: ${model.epic}`,
    ``,
    `Roles:`,
    formatList(model.roles),
    ``,
    `Quality goals:`,
    formatList(model.qualityGoals),
    ``,
    `Emotional goals:`,
    formatList(model.emotionalGoals),
    ``,
    `Concerns:`,
    formatList(model.concerns),
    ``,
    `As a <role>, I want to <functional goal> so that <quality goal>. I want to feel <emotional goal>.`,
    `  - <sub-task 1>`,
    `  - <sub-task 2>`,
    ``,
    `Do NOT invent requirements not in the model.`,
    `Do NOT rename the system.`,
    `Do NOT add roles not listed.`,
    `If you make an assumption, prefix it with "ASSUMPTION:"`,
    `Return ONLY the user stories, no explanation, no preamble.`,
    ``,
    `Stories to generate:`,
    ...(storyLines.length > 0 ? storyLines : ["  - (none)"]),
  ].join("\n");
}
