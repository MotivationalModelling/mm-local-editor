describe("Related links after develop integration", () => {
    it("saves a link, opens it from the canvas, and retains it after refresh", () => {
        const url = "https://example.com/related-document";
        cy.visit("/");
        cy.contains("Create Model").click();
        cy.get('[aria-label="Related link for Do"]').first().click();
        cy.get('#goal-related-link').type(url);
        cy.contains('.modal button', 'Save').click();
        cy.get('.modal').should('not.exist');

        cy.contains("Arrange Hierarchy / Render Model").click();
        cy.window().then((win) => cy.stub(win, "open").as("openLink"));
        cy.get('#graphContainer text').contains(/^Do$/)
            .should('have.css', 'fill', 'rgb(13, 110, 253)')
            .click({force: true});
        cy.get('@openLink').should('have.been.calledWith', url, '_blank', 'noopener,noreferrer');

        cy.reload();
        cy.contains("Arrange Hierarchy / Render Model").click();
        cy.window().then((win) => cy.stub(win, "open").as("restoredLink"));
        cy.get('#graphContainer text').contains(/^Do$/).click({force: true});
        cy.get('@restoredLink').should('have.been.calledWith', url, '_blank', 'noopener,noreferrer');
    });
});
