describe("Dashboard project sharing", () => {
    it("opens the selected project's model and feedback as a new shared copy", () => {
        const firstGoal = {id: 1, content: "First project goal", type: "Do", instanceId: "1:1", children: []};
        const secondGoal = {id: 2, content: "Second project goal", type: "Do", instanceId: "2:1", children: []};
        const makeProject = (id: string, name: string, goal: typeof firstGoal) => ({
            id, name, treeData: [goal],
            tabData: ["Do", "Be", "Feel", "Concern", "Who"].map((label) => ({
                label, icon: "", rows: label === "Do" ? [goal] : [],
            })),
            feedbacks: [{id: `${id}-feedback`, nodeId: `Functional-${goal.instanceId}`,
                nodeLabel: goal.content, author: "Reviewer", content: `${name} feedback`,
                createdAt: "Just now", status: "open"}],
            createdAt: 1000, updatedAt: 2000,
        });

        cy.visit("/projects", {onBeforeLoad(win) {
            win.localStorage.setItem("ammber/projects", JSON.stringify([
                makeProject("first", "First model", firstGoal),
                makeProject("second", "Second model", secondGoal),
            ]));
        }});

        cy.get('[aria-label="Options for Second model"]').click();
        cy.contains(".dropdown-menu", "Share").click();
        cy.get('input[aria-label="Share link"]').invoke("val").then((value) => {
            const shareUrl = String(value);
            expect(shareUrl).to.include("#share=");
            cy.visit(shareUrl);
        });

        cy.location("pathname").should("include", "/projectEdit");
        cy.window().should((win) => {
            const projects = JSON.parse(win.localStorage.getItem("ammber/projects") ?? "[]");
            const currentId = win.localStorage.getItem("ammber/currentProjectId");
            const sharedCopy = projects.find((project: {id: string}) => project.id === currentId);
            expect(projects).to.have.length(3);
            expect(sharedCopy.treeData[0].content).to.equal("Second project goal");
            expect(sharedCopy.feedbacks[0].content).to.equal("Second model feedback");
        });
    });
});
