describe('Non-functional goal geometry', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Create Model').click();
    cy.contains('Arrange Hierarchy / Render Model').click();
    cy.get('[data-cy="graph-canvas"]').should('be.visible');
  });

  it('preserves shape geometry when a concern label is edited', () => {
    const getShapePaths = ($paths: JQuery<SVGPathElement>) => Array.from($paths)
      .filter((path) => path.getAttribute('fill') !== 'none')
      .map((path) => path.getAttribute('d'));

    cy.get('#graphContainer path')
      .then(getShapePaths)
      .as('initialShapePaths');

    cy.contains('#graphContainer li', 'Be').click({force: true});
    cy.get('#graphContainer rect[fill="#00ff00"]')
      .should('have.length', 8)
      .last()
      .then(($handle) => {
        const bounds = $handle[0].getBoundingClientRect();
        const startX = bounds.x + bounds.width / 2;
        const startY = bounds.y + bounds.height / 2;
        const endX = startX + 80;
        const endY = startY + 60;

        cy.wrap($handle).trigger('pointerdown', {
          button: 0,
          buttons: 1,
          clientX: startX,
          clientY: startY,
          pointerId: 1,
          pointerType: 'mouse',
          force: true,
        });
        cy.document().trigger('pointermove', {
          button: 0,
          buttons: 1,
          clientX: endX,
          clientY: endY,
          pointerId: 1,
          pointerType: 'mouse',
          force: true,
        });
        cy.document().trigger('pointerup', {
          button: 0,
          buttons: 0,
          clientX: endX,
          clientY: endY,
          pointerId: 1,
          pointerType: 'mouse',
          force: true,
        });
      });

    cy.get('@initialShapePaths').then((initialShapePaths) => {
      cy.get('#graphContainer path').then(($paths) => {
        const resizedShapePaths = getShapePaths($paths);

        expect(resizedShapePaths).not.to.deep.equal(initialShapePaths);
        cy.wrap(resizedShapePaths).as('resizedShapePaths');
      });
    });

    cy.contains('#graphContainer li', 'Concern').dblclick({force: true});
    cy.get('.mxCellEditor')
      .should('be.visible')
      .and('have.css', 'overflow', 'auto')
      .find('li')
      .should('have.length', 1)
      .and('contain.text', 'Concern');
    cy.get('.mxCellEditor')
      .type('{selectall}Concern and');
    cy.get('#graphContainer').click(5, 5, {force: true});

    cy.get('.mxCellEditor').should('not.exist');
    cy.contains('#graphContainer li', 'Concern and').should('be.visible');
    cy.get('@resizedShapePaths').then((shapePaths) => {
      cy.get('#graphContainer path').then(($paths) => {
        const updatedShapePaths = getShapePaths($paths);

        expect(updatedShapePaths).to.deep.equal(shapePaths);
      });
    });
  });
});
