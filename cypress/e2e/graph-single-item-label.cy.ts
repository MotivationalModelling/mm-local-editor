describe('Single-item goal labels', () => {
  for (const type of ['Be', 'Feel', 'Concern']) {
    it(`${type}: omits the bullet through editing, saving and one/two-item transitions`, () => {
      const original = 'Careful, "responsible" & willing to learn from experience';
      const edited = `${original} today`;
      const second = 'Second goal';
      const root = {id: 1, content: 'Root goal', type: 'Do', instanceId: '1:1', children: []};
      const goal = {id: 2, content: original, type, instanceId: '2:1', children: []};
      let saved = '';
      cy.visit('/projectEdit', {onBeforeLoad(window) {
        window.localStorage.setItem('ammber/treeData', JSON.stringify([root, goal]));
        window.localStorage.setItem('ammber/tabData', JSON.stringify(
          ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(label => ({
            label, icon: '', rows: label === 'Do' ? [root] : label === type ? [goal] : [],
          })),
        ));
        Object.defineProperty(window.navigator, 'userAgent', {
          value: window.navigator.userAgent.replace(/Electron\/\S+\s*/g, '').replace('HeadlessChrome', 'Chrome'),
        });
        Object.defineProperty(window, 'showSaveFilePicker', {value: async () => ({
          createWritable: async () => ({
            write: async (data: string) => { saved = data; },
            close: async () => undefined,
          }),
        })});
      }});
      cy.get('#graphTab').click();
      cy.get('#graphContainer li').should('have.length', 1)
        .and('have.text', original).and('have.css', 'list-style-type', 'none')
        .and('have.css', 'margin-left', '0px').should(items => {
          const item = items[0];
          expect(item.getBoundingClientRect().left).to.equal(item.parentElement!.getBoundingClientRect().left);
          // The cloud's narrower label area wraps this single goal across lines.
          if (type === 'Be') {
            // Compare layout height with font size before the graph's zoom transform.
            expect(item.clientHeight).to.be.greaterThan(parseFloat(getComputedStyle(item).fontSize) * 1.8);
          }
        });

      cy.contains('#graphContainer li', original).dblclick({force: true});
      cy.get('.mxCellEditor li').should('have.length', 1).and('have.css', 'list-style-type', 'none')
        .click().type('{end} discarded{esc}');
      cy.contains('#graphContainer li', original).should('have.text', original);
      cy.contains('#graphContainer li', original).dblclick({force: true});
      cy.get('.mxCellEditor li').click().type('{end} today');
      cy.contains('button', /^Save$/).click();
      cy.get('.mxCellEditor').should('not.exist');
      cy.wrap(null).should(() => {
        expect(saved).not.to.equal('');
        expect(JSON.parse(saved).treeData.find((goal: {id: number}) => goal.id === 2).content).to.equal(edited);
      });

      cy.visit('/');
      cy.contains('button', 'Open Model').click();
      cy.then(() => cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from(saved), fileName: 'single-goal.json', mimeType: 'application/json',
      }, {force: true}));
      cy.contains('button', /^Upload$/).click();
      cy.get('#graphTab').click();
      cy.get('#graphContainer li').should('have.length', 1)
        .and('have.text', edited).and('have.css', 'list-style-type', 'none');

      // Change the hierarchy through the goal list, not the text editor:
      // graph editing deliberately preserves the number of model goals.
      cy.get('#clusterTab').click();
      cy.contains('.nav-link', new RegExp(`^${type}$`)).click();
      cy.get('.tab-pane.active > .d-flex > button').click();
      cy.get<HTMLInputElement>(`input[placeholder="Enter ${type}..."]`).last().type(`${second}{enter}`);
      cy.get(`input[placeholder="Enter ${type}..."][value="${second}"]`)
        .closest('tr').find('input[type="checkbox"]').check();
      cy.contains('button', 'Add Group').click();
      cy.get('#graphTab').click();
      cy.get('#graphContainer li').should('have.length', 2).each(item => {
        cy.wrap(item).should('have.css', 'list-style-type', 'disc');
      });
      cy.contains('#graphContainer li', edited).dblclick({force: true});
      cy.get('.mxCellEditor li').should('have.length', 2).each(item => {
        cy.wrap(item).should('have.css', 'list-style-type', 'disc');
      });
      cy.get('.mxCellEditor').type('{esc}');
      cy.get('#clusterTab').click();
      cy.contains('.nav-link', new RegExp(`^${type}$`)).click();
      cy.get(`input[placeholder="Enter ${type}..."][value="${second}"]`)
        .closest('tr').find('button').click();
      cy.get('#graphTab').click();
      cy.get('#graphContainer li').should('have.length', 1)
        .and('have.text', edited).and('have.css', 'list-style-type', 'none')
        .and('have.css', 'margin-left', '0px');
    });
  }
});
