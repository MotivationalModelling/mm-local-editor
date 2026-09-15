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

    cy.get('#graphContainer').contains('Concern').click({force: true});

    cy.get('body').type('{backspace}');

    cy.get('#graphContainer').contains('Concern').should('not.exist');
  });

  it('should show a dialog when delete cells with children', () => {

    cy.get('#graphContainer').contains('Do').click({force: true});

    cy.get('body').type('{backspace}');

    cy.get('.modal-title').should('contain', 'Delete goal with children');
    cy.contains('Delete associated goal(s)').should('be.visible');

    cy.get('input[type="checkbox"]').check({force: true});

    cy.get('[data-cy="confirm-delete"]').click();

    cy.get('#graphContainer').contains('Do').should('not.exist');

     cy.get('#graphContainer').contains('Do 1').should('not.exist');
  });

  it('removes every goal represented by a grouped cell from the hierarchy', () => {
    const root = {id: 1, content: 'Root goal', type: 'Do', instanceId: '1:1', children: []};
    const concerns = [
      {id: 2, content: 'First concern', type: 'Concern', instanceId: '2:1', children: []},
      {id: 3, content: 'Second concern', type: 'Concern', instanceId: '3:1', children: []},
    ];
    cy.visit('/projectEdit', {onBeforeLoad(window) {
      window.localStorage.setItem('ammber/treeData', JSON.stringify([root, ...concerns]));
      window.localStorage.setItem('ammber/tabData', JSON.stringify(
        ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(label => ({
          label, icon: '', rows: label === 'Do' ? [root] : label === 'Concern' ? concerns : [],
        })),
      ));
    }});
    cy.get('#graphTab').click();
    cy.contains('#graphContainer li', 'First concern').click({force: true});
    cy.get('body').type('{backspace}');
    cy.contains('#graphContainer li', 'First concern').should('not.exist');
    cy.contains('#graphContainer li', 'Second concern').should('not.exist');
    cy.window().should(window => {
      const tree = JSON.parse(window.localStorage.getItem('ammber/treeData')!);
      expect(tree.map((goal: {id: number}) => goal.id)).to.deep.equal([1]);
    });
  });
});
