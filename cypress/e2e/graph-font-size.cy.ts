describe('Graph Font Size UI Tests', () => {
  beforeEach(() => {
    cy.viewport(1440, 1000);
    cy.visit('/');
    cy.contains('Create Model').click();
    cy.contains('Arrange Hierarchy / Render Model').click();
    cy.get('[data-cy="graph-canvas"]').should('be.visible');
  });

  const fontInput = () => cy.get('input[aria-label="Font size"]');
  const increase = () => cy.get('button[aria-label="Increase font size"]').click();
  const decrease = () => cy.get('button[aria-label="Decrease font size"]').click();
  const selectGoal = (label: string, addToSelection = false) => (
    cy.get('#graphContainer text').contains(new RegExp(`^${label}$`)).click({
      force: true, metaKey: addToSelection, ctrlKey: addToSelection,
    })
  );
  const clearSelection = () => cy.get('#graphContainer').click(5, 5);
  const expectFontSize = (label: string, size: number) => {
    selectGoal(label);
    fontInput().should('have.value', String(size));
  };

  it('should default to 16 and adjust all goal types without a selection', () => {
    cy.contains('Font size').click();
    fontInput().should('have.value', '16');
    increase();
    fontInput().should('have.value', '17');
    ['Do', 'Do1', 'Do2', 'Do3', 'Be', 'Feel', 'Who', 'Concern'].forEach(label => expectFontSize(label, 17));
    clearSelection();
    decrease();
    fontInput().should('have.value', '16');
    cy.get('#graphContainer text').should(($labels) => {
      const sizes = Array.from($labels).map(label => getComputedStyle(label).fontSize);
      expect(new Set(sizes).size).to.equal(1);
    });
  });

  it('should leave mixed sizes blank and preserve their difference when stepping', () => {
    cy.contains('Font size').click();
    selectGoal('Do');
    fontInput().clear().type('20{enter}');
    expectFontSize('Do1', 16);
    selectGoal('Do', true);
    fontInput().should('have.value', '');
    increase();
    fontInput().should('have.value', '');
    expectFontSize('Do', 21);
    expectFontSize('Do1', 17);
    expectFontSize('Feel', 16);

    clearSelection();
    fontInput().should('have.value', '');
    fontInput().type('24{enter}');
    ['Do', 'Do1', 'Feel', 'Who'].forEach(label => expectFontSize(label, 24));
  });

  it('should commit on blur and reject empty or out-of-range input', () => {
    cy.contains('Font size').click();
    selectGoal('Do');
    cy.get('#graphContainer text').contains(/^Do$/).invoke('css', 'font-size').as('originalSize');
    fontInput().clear().type('24');
    cy.get('@originalSize').then(size => {
      cy.get('#graphContainer text').contains(/^Do$/).should('have.css', 'font-size', size);
    });
    fontInput().blur().should('have.value', '24');
    ['', '7', '41'].forEach(value => {
      fontInput().clear();
      if (value) fontInput().type(value);
      fontInput().blur().should('have.value', '24');
    });
    clearSelection();
    fontInput().should('have.value', '').focus().blur().should('have.value', '');
    expectFontSize('Do', 24);
    expectFontSize('Feel', 16);
  });

  it('should clamp each element independently at the size limits', () => {
    cy.contains('Font size').click();
    selectGoal('Do');
    fontInput().clear().type('40{enter}');
    selectGoal('Do1');
    fontInput().clear().type('8{enter}');
    selectGoal('Do', true);
    increase();
    expectFontSize('Do', 40);
    expectFontSize('Do1', 9);
    selectGoal('Do', true);
    decrease();
    decrease();
    expectFontSize('Do', 38);
    expectFontSize('Do1', 8);
  });

  it('should commit a draft to its original selection when another goal is clicked', () => {
    cy.contains('Font size').click();
    selectGoal('Do');
    fontInput().clear().type('24');
    expectFontSize('Do1', 16);
    expectFontSize('Do', 24);
  });

  it('should undo a global adjustment in one step and update the displayed size', () => {
    cy.contains('Font size').click();
    increase();
    fontInput().should('have.value', '17');
    cy.get('#graphContainer').focus().trigger('keydown', {
      key: 'z', code: 'KeyZ', keyCode: 90, which: 90, metaKey: true, ctrlKey: true,
    });
    fontInput().should('have.value', '16');
    ['Do', 'Do1', 'Feel', 'Who'].forEach(label => expectFontSize(label, 16));
  });

  it('should not display duplicate text when font size changes during editing', () => {
    cy.get('#graphContainer text').contains('Feel').then(($text) => {
      cy.wrap(parseFloat(getComputedStyle($text[0]).fontSize)).as('initialFontSize');
    });
    cy.get('#graphContainer').contains('Feel').dblclick({force: true});
    cy.get('.mxCellEditor').should('be.visible');

    cy.contains('Font size').click();
    cy.contains('Font size').parent().find('input[type="number"]')
      .type('{selectall}24{enter}')
      .should('have.value', '24');

    cy.get('.mxCellEditor').should('be.visible');
    cy.get('#graphContainer text').contains('Feel').should('not.be.visible');
    cy.get('.mxCellEditor').should('have.css', 'font-size', '24px');

    cy.contains('Font size').parent().find('input[type="number"]')
      .type('{selectall}25{enter}')
      .should('have.value', '25');
    cy.get('.mxCellEditor').should('have.css', 'font-size', '25px');

    increase();
    cy.get('.mxCellEditor').should('have.css', 'font-size', '26px');
    decrease();
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
      .type('{selectall}17{enter}')
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
      .type('{selectall}24{enter}')
      .should('have.value', '24');

    cy.get('@dottedPathData').then((pathData) => {
      cy.get('#graphContainer path[stroke-dasharray]').then(($paths) => {
        const updatedPathData = Array.from($paths).map((path) => path.getAttribute('d'));
        expect(updatedPathData).to.deep.equal(pathData);
      });
    });
  });
});
