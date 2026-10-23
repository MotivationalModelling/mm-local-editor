const appUrl = "http://localhost:5173/mm-local-editor/";

const imageModel = {
    tabData: [
        {label: "Do", icon: "/img/Function.png", goalIds: [1]},
        {label: "Be", icon: "/img/Cloud.png", goalIds: []},
        {label: "Feel", icon: "/img/Heart.png", goalIds: []},
        {label: "Concern", icon: "/img/Risk.png", goalIds: []},
        {label: "Who", icon: "/img/Stakeholder.png", goalIds: []},
    ],
    treeData: [{id: 1, content: "Image imported goal", type: "Do", instanceId: "1:1", children: []}],
};

describe("share and image import", () => {
    it("opens a model from a share link", () => {
        cy.visit(appUrl);
        cy.contains("Create Model").click();
        cy.contains("Share").click();
        cy.get('[data-testid="share-qr"]').should("be.visible");
        cy.get('[aria-label="Share link"]').invoke("val").then((value) => {
            const link = String(value);
            expect(link).to.include("#share=");
            cy.visit(link);
        });
        cy.url().should("include", "/projectEdit");
        cy.contains("Share").should("be.visible");
    });

    it("imports model data embedded in a PNG", () => {
        const png = Cypress.Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==",
            "base64"
        );
        const metadata = Cypress.Buffer.from("MMEDITOR_PROJECT_DATA::" + JSON.stringify(imageModel));

        cy.visit(appUrl);
        cy.contains("Open Model").click();
        cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.concat([png, metadata]),
            fileName: "shared-model.png",
            mimeType: "image/png",
        }, {force: true});
        cy.contains("Upload").click();
        cy.contains("Image imported goal").should("exist");
    });

    it("imports model data embedded in an SVG", () => {
        const encoded = Cypress.Buffer.from(JSON.stringify(imageModel)).toString("base64");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg"><metadata id="mm-editor-project-data">${encoded}</metadata></svg>`;

        cy.visit(appUrl);
        cy.contains("Open Model").click();
        cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from(svg),
            fileName: "shared-model.svg",
            mimeType: "image/svg+xml",
        }, {force: true});
        cy.contains("Upload").click();
        cy.contains("Image imported goal").should("exist");
    });
});
