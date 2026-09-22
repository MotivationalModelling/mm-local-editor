describe('Graph Font Size UI Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Create Model').click();
    cy.contains('Arrange Hierarchy / Render Model').click();
    cy.get('[data-cy="graph-canvas"]').should('be.visible');
  });

  it('should not display duplicate text when font size changes during editing', () => {
    cy.get('#graphContainer text').contains('Feel').then(($text) => {
      cy.wrap(parseFloat(getComputedStyle($text[0]).fontSize)).as('initialFontSize');
    });
    cy.get('#graphContainer').contains('Feel').dblclick({force: true});
    cy.get('.mxCellEditor').should('be.visible');

    cy.contains('Font size').click();
    cy.contains('Font size').parent().find('input[type="number"]')
      .type('{selectall}24')
      .should('have.value', '24');

    cy.get('.mxCellEditor').should('be.visible');
    cy.get('#graphContainer text').contains('Feel').should('not.be.visible');
    cy.get('.mxCellEditor').should('have.css', 'font-size', '24px');

    cy.contains('Font size').parent().find('input[type="number"]')
      .type('{selectall}25')
      .should('have.value', '25');
    cy.get('.mxCellEditor').should('have.css', 'font-size', '25px');

    cy.get('.mxCellEditor').type('{esc}');
    cy.get('.mxCellEditor').should('not.exist');
    cy.get('@initialFontSize').then((initialFontSize) => {
      cy.get('#graphContainer text').contains('Feel')
        .should('be.visible')
        .and(($text) => {
          const updatedFontSize = parseFloat(getComputedStyle($text[0]).fontSize);
          expect(updatedFontSize).to.be.closeTo(Number(initialFontSize) * 25 / 16, 0.1);
        });
    });
  });

  it('should preserve a functional goal shape when font size changes', () => {
    cy.get('#graphContainer text').contains('Do3').then(($text) => {
      cy.wrap(parseFloat(getComputedStyle($text[0]).fontSize)).as('initialFunctionalFontSize');
    });
    cy.get('#graphContainer text').contains('Do3').click({force: true});
    cy.get('#graphContainer path').then(($paths) => {
      const shapePathData = Array.from($paths)
        .filter((path) => path.getAttribute('fill') !== 'none')
        .map((path) => path.getAttribute('d'));
      cy.wrap(shapePathData).as('shapePathData');
    });

    cy.contains('Font size').click();
    cy.contains('Font size').parent().find('input[type="number"]')
      .type('{selectall}17')
      .should('have.value', '17');

    cy.get('@shapePathData').then((shapePathData) => {
      cy.get('#graphContainer path').then(($paths) => {
        const updatedShapePathData = Array.from($paths)
          .filter((path) => path.getAttribute('fill') !== 'none')
          .map((path) => path.getAttribute('d'));
        expect(updatedShapePathData).to.deep.equal(shapePathData);
      });
    });
    cy.get('@initialFunctionalFontSize').then((initialFontSize) => {
      cy.get('#graphContainer text').contains('Do3').should(($text) => {
        const updatedFontSize = parseFloat(getComputedStyle($text[0]).fontSize);
        expect(updatedFontSize).to.be.closeTo(Number(initialFontSize) * 17 / 16, 0.1);
      });
    });
  });

  it('should preserve dotted connections when font size changes', () => {
    cy.get('#graphContainer path[stroke-dasharray]').then(($paths) => {
      const pathData = Array.from($paths).map((path) => path.getAttribute('d'));
      cy.wrap(pathData).as('dottedPathData');
    });

    cy.get('#graphContainer text').contains('Feel').dblclick({force: true});
    cy.contains('Font size').click();
    cy.contains('Font size').parent().find('input[type="number"]')
      .type('{selectall}24')
      .should('have.value', '24');

    cy.get('@dottedPathData').then((pathData) => {
      cy.get('#graphContainer path[stroke-dasharray]').then(($paths) => {
        const updatedPathData = Array.from($paths).map((path) => path.getAttribute('d'));
        expect(updatedPathData).to.deep.equal(pathData);
      });
    });
  });
});
