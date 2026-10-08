describe("project management", () => {
    it("renames a project and keeps the name after reload", () => {
        cy.visit("/projects");
        cy.get('[data-cy="new-project"]').click();
        cy.contains("Home").click();
        cy.get('[data-cy="project-card"] [aria-label^="Options for"]').click();
        cy.get(".dropdown-menu").contains("Rename").click();
        cy.get('input[aria-label="Project name"]').clear().type("Renamed project");
        cy.contains("button", "Save").click();
        cy.get('[data-cy="project-card"] [data-cy="project-name"]').should("have.text", "Renamed project");
        cy.reload();
        cy.get('[data-cy="project-card"] [data-cy="project-name"]').should("have.text", "Renamed project");
    });

    it("keeps feedback with its project across switching and reload", () => {
        cy.visit("/projects");
        cy.get('[data-cy="new-project"]').click();
        cy.get(".project-edit-header").contains("Feedback").click();
        cy.get("#feedback-overall-content").type("First project review");
        cy.get(".feedback-overall-save").click();
        cy.contains("Home").click();

        cy.get('[data-cy="new-project"]').click();
        cy.get(".project-edit-header").contains("Feedback").click();
        cy.get("#feedback-overall-content").should("have.value", "");
        cy.contains("Home").click();

        cy.get('[data-cy="project-card"]').should("have.length", 2).eq(1).find('[data-cy="open-project"]').click();
        cy.get(".project-edit-header").contains("Feedback").click();
        cy.get("#feedback-overall-content").should("have.value", "First project review");
        cy.reload();
        cy.get(".project-edit-header").contains("Feedback").click();
        cy.get("#feedback-overall-content").should("have.value", "First project review");
    });

    it("keeps each project model separate", () => {
        cy.visit("/projects");
        cy.get('[data-cy="new-project"]').click();
        cy.contains("Reset").click();
        cy.contains("Empty").click();
        cy.contains("Home").click();
        cy.get('[data-cy="new-project"]').click();
        cy.window().then((window) => {
            const projects = JSON.parse(window.localStorage.getItem("ammber/projects") ?? "[]");
            expect(projects).to.have.length(2);
            expect(projects[0].treeData.length).to.be.greaterThan(0);
            expect(projects[1].treeData).to.have.length(0);
        });
        cy.contains("Home").click();
        cy.get('[data-cy="project-card"]').eq(1).find('[data-cy="open-project"]').click();
        cy.reload();
        cy.window().then((window) => {
            const currentId = window.localStorage.getItem("ammber/currentProjectId");
            const projects = JSON.parse(window.localStorage.getItem("ammber/projects") ?? "[]");
            expect(projects.find((project: {id: string}) => project.id === currentId).treeData).to.have.length(0);
        });
    });

    it("imports a JSON model as a new project", () => {
        const model = {
            tabData: ["Do", "Be", "Feel", "Concern", "Who"].map((label) => ({
                label, icon: "/img/Function.png", goalIds: label === "Do" ? [1] : [],
            })),
            treeData: [{id: 1, content: "Imported project goal", type: "Do", instanceId: "1:1", children: []}],
        };
        cy.visit("/projects");
        cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from(JSON.stringify(model)),
            fileName: "Roadmap.json",
            mimeType: "application/json",
        }, {force: true});
        cy.url().should("include", "/projectEdit");
        cy.contains("Home").click();
        cy.get('[data-cy="project-card"]').contains("Roadmap").should("be.visible");
    });

    it("shows a model preview and downloads both image formats from a project card", () => {
        const model = {
            tabData: ["Do", "Be", "Feel", "Concern", "Who"].map((label) => ({
                label, icon: "/img/Function.png", goalIds: label === "Do" ? [1] : [],
            })),
            treeData: [{id: 1, content: "Reviewed goal", type: "Do", instanceId: "1:1", children: []}],
            overallFeedback: {author: "Team", content: "Overall feedback text", updatedAt: "2026-09-28"},
            feedbacks: [{id: "feedback-1", nodeId: "Functional-1:1", nodeLabel: "Reviewed goal",
                author: "Team", content: "Goal feedback text", createdAt: "Just now", status: "open"}],
        };
        cy.visit("/projects");
        cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from(JSON.stringify(model)),
            fileName: "Reviewed.json",
            mimeType: "application/json",
        }, {force: true});
        cy.contains("Home").click();
        cy.get('[data-cy="project-card"] img').should("be.visible")
            .should("have.attr", "src").and("include", "data:image/svg+xml");
        cy.get('[data-cy="project-card"] img').then(($image) => {
            const image = $image[0].getBoundingClientRect();
            const thumbnail = $image[0].parentElement!.getBoundingClientRect();
            expect(image.top).to.be.at.least(thumbnail.top);
            expect(image.bottom).to.be.at.most(thumbnail.bottom);
        });
        cy.get('[data-cy="project-card"] [aria-label^="Options for"]').click();
        cy.get(".dropdown-menu").contains("Share").click();
        cy.get(".share-dialog").contains("Include goal feedback").should("be.visible");
        cy.get(".share-dialog").contains("button", "Export").click();
        cy.get(".share-dialog").contains("Export as SVG").click();
        cy.readFile("cypress/downloads/Reviewed.svg").should("include", "Overall feedback text")
            .and("include", "Goal feedback text");
        cy.get(".share-dialog").contains("button", "Export").click();
        cy.get(".share-dialog").contains("Export as PNG").click();
        cy.readFile("cypress/downloads/Reviewed.png", null).should("have.length.greaterThan", 100);
    });

    it("aligns the header actions with the project content", () => {
        cy.viewport(1900, 900);
        cy.visit("/projects");
        cy.get('[data-cy="new-project"]').click();
        cy.contains("Home").click();
        cy.get("header button").contains("Import").then(($button) => {
            const right = $button[0].getBoundingClientRect().right;
            cy.get("main").then(($main) => {
                const main = $main[0];
                const contentRight = main.getBoundingClientRect().right -
                    Number.parseFloat(getComputedStyle(main).paddingRight);
                expect(Math.abs(right - contentRight)).to.be.lessThan(3);
            });
        });
        cy.get("h1").contains("Projects").then(($heading) => {
            const right = $heading[0].getBoundingClientRect().right;
            cy.contains("1 project").then(($count) => {
                expect($count[0].getBoundingClientRect().left - right).to.be.lessThan(30);
            });
        });
    });

    it("includes visible feedback in the editor SVG export", () => {
        let savedSvg = "";
        cy.visit("/");
        cy.contains("Create Model").click();
        cy.contains("Arrange Hierarchy / Render Model").click();
        cy.get('[data-cy="graph-canvas"]').should("be.visible");
        cy.window().then((window) => {
            Object.defineProperty(window, "showSaveFilePicker", {configurable: true, value: async () => ({
                createWritable: async () => ({
                    write: async (blob: Blob) => { savedSvg = await blob.text(); },
                    close: async () => {},
                }),
            })});
        });
        cy.get(".project-edit-header").contains("Share").click();
        cy.get(".share-dialog").contains("Include goal feedback").should("be.visible");
        cy.get(".share-dialog").contains("button", "Export").click();
        cy.get(".share-dialog").contains("Export as SVG").click();
        cy.wrap(null).should(() => {
            expect(savedSvg).to.include("mm-editor-project-data");
            expect(savedSvg).to.include("data:image/png;base64");
        });
    });
});
