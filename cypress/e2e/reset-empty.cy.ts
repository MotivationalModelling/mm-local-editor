describe('Reset to empty UI Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains("Create Model").click();
    cy.contains("Arrange Hierarchy / Render Model").click();
    cy.get('[data-cy="graph-canvas"]').should('be.visible');
  });

  it('should keep the editor visible after resetting to an empty model', () => {
    cy.contains('Reset').click();
    cy.contains('Empty').click();

    cy.contains('AMMBER').should('be.visible');
    cy.contains('Drag goals here to build the hierarchy').should('be.visible');
    cy.get('[data-cy="graph-canvas"]').should('be.visible');
  });
});
