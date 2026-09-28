describe("goal text synchronization", () => {
    it("updates the rendered model when a goal is edited in the goal list", () => {
        cy.visit("/");
        cy.contains("Create Model").click();
        cy.contains("Arrange Hierarchy / Render Model").click();
        cy.contains("Show goal list").click();
        cy.get('[data-cy="graph-canvas"]').should("be.visible");

        cy.get('.tab-pane.active input[type="text"]').first().clear().type("Updated goal{enter}");
        cy.get('[data-cy="graph-canvas"]').contains("Updated").should("be.visible");

        cy.reload();
        cy.contains("Arrange Hierarchy / Render Model").click();
        cy.get('[data-cy="graph-canvas"]').contains("Updated").should("be.visible");
    });
});
