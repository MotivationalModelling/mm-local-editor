// cypress/e2e/graph_delete.cy.ts

describe('Graph Deletion UI Tests', () => {
  beforeEach(() => {
    // 1. Start at the page and ensure graph is loaded with data
    cy.visit('/');
    cy.contains("Create Model").click();
    cy.contains("Arrange Hierarchy / Render Model").click();
    cy.get('[data-cy="graph-canvas"]').should('be.visible');
  });

  it('should delete a single cell without children directly', () => {

    cy.get('#graphContainer').contains('Concern').click({ force: true });

    cy.get('body').type('{backspace}');

    cy.get('#graphContainer').contains('Concern').should('not.exist');
  });

  it('should show a dialog when delete cells with children', () => {

    cy.get('#graphContainer').contains('Do').click({ force: true });

    cy.get('body').type('{backspace}');

    cy.get('.modal-title').should('contain', 'Delete goal with children');
    cy.contains('Delete associated goal(s)').should('be.visible');

    cy.get('input[type="checkbox"]').check({ force: true });

    cy.get('[data-cy="confirm-delete"]').click();

    cy.get('#graphContainer').contains('Do').should('not.exist');

     cy.get('#graphContainer').contains('Do 1').should('not.exist');
  });
});