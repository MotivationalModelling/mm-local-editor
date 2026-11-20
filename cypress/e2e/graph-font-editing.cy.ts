describe('Font changes during label editing', () => {
  for (const type of ['Do', 'Be', 'Feel', 'Concern', 'Who']) {
    it(`keeps only the editor visible for ${type} when growing and shrinking text`, () => {
      const root = {id: 1, content: 'Complete the internship', type: 'Do', instanceId: '1:1', children: []};
      const goal = {id: 2, content: 'Work independently', type, instanceId: '2:1', children: []};
      const tree = type === 'Do' ? [root] : [root, goal];
      const original = type === 'Do' ? root.content : goal.content;
      cy.visit('/projectEdit', {onBeforeLoad(win) {
        win.localStorage.setItem('ammber/treeData', JSON.stringify(tree));
        win.localStorage.setItem('ammber/tabData', JSON.stringify(
          ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(label => ({
            label, icon: '', rows: tree.filter(item => item.type === label),
          }))));
      }});
      cy.get('#graphTab').click();
      cy.contains('Font size').click();
      const renderedLabel = () => cy.contains('#graphContainer .goal-label-text, #graphContainer li, #graphContainer text', original);

      // Repeat after committing, then cancel a second draft. Both paths must restore the label.
      for (const finish of ['{enter}', '{esc}']) {
        renderedLabel().dblclick({force: true});
        cy.get('.mxCellEditor').type('{end} draft');
        for (const size of [40, 12]) {
          cy.contains('Font size').parent().find('input').type(`{selectall}${size}`);
          cy.get('.mxCellEditor').should('have.length', 1)
            .and('have.css', 'font-size', `${size}px`).and('contain.text', 'draft');
          // Query the live label again: refresh may have replaced the original DOM node.
          renderedLabel().should('have.css', 'visibility', 'hidden');
        }
        cy.get('.mxCellEditor').type(finish);
        cy.get('.mxCellEditor').should('not.exist');
        renderedLabel().should('have.css', 'visibility', 'visible')
          .and('contain.text', `${original} draft`)
          .and('not.contain.text', 'draft draft');
      }
    });
  }
});
