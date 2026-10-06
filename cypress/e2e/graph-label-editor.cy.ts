describe('Non-functional goal label editor', () => {
  const rootGoal = {
    id: 1,
    content: 'Root goal',
    type: 'Do',
    instanceId: '1-1',
    children: [],
  };
  const concerns = [
    'Unfamiliar codebase, tools & "workflow"',
    'Incomplete tasks',
    'Software regressions',
    'Unmet expectations',
  ].map((content, index) => ({
    id: index + 2,
    content,
    type: 'Concern',
    instanceId: `${index + 2}-1`,
    children: [],
  }));

  beforeEach(() => {
    const tabs = [
      {label: 'Do', icon: '/img/Function.png', rows: [rootGoal]},
      {label: 'Be', icon: '/img/Cloud.png', rows: []},
      {label: 'Feel', icon: '/img/Heart.png', rows: []},
      {label: 'Concern', icon: '/img/Risk.png', rows: concerns},
      {label: 'Who', icon: '/img/Stakeholder.png', rows: []},
    ];

    cy.visit('/projectEdit', {
      onBeforeLoad(win) {
        win.localStorage.setItem('ammber/tabData', JSON.stringify(tabs));
        win.localStorage.setItem('ammber/treeData', JSON.stringify([rootGoal, ...concerns]));
      },
    });
    cy.contains('Arrange Hierarchy / Render Model').click();
    cy.get('[data-cy="graph-canvas"]').should('be.visible');
  });

  it('keeps punctuation in a single Do goal', () => {
    cy.contains('#graphContainer text', 'Root').dblclick({force: true});
    cy.get('.mxCellEditor').should('be.visible').type('{selectall}Plan, build & test{enter}');
    cy.get('.mxCellEditor').should('not.exist');
    cy.get('#graphContainer text').should(elements => {
      expect(Array.from(elements, element => element.textContent).join(' ')).to.include('Plan, build & test');
    });
    cy.window().should(window => {
      const tabs = JSON.parse(window.localStorage.getItem('ammber/tabData')!);
      expect(tabs.find((tab: {label: string}) => tab.label === 'Do').rows[0].content).to.equal('Plan, build & test');
    });
  });

  it('displays grouped Who labels without encoding quotes or extra blank lines', () => {
    const stakeholders = ['Supervisor, Leon', 'Intern "Wenhao"'].map((content, index) => ({
      id: index + 20, content, type: 'Who', instanceId: `${index + 20}:1`, children: [],
    }));
    cy.visit('/projectEdit', {onBeforeLoad(window) {
      window.localStorage.setItem('ammber/treeData', JSON.stringify([rootGoal, ...stakeholders]));
      window.localStorage.setItem('ammber/tabData', JSON.stringify(
        ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(label => ({
          label, icon: '', rows: label === 'Do' ? [rootGoal] : label === 'Who' ? stakeholders : [],
        })),
      ));
    }});
    cy.get('#graphTab').click();
    cy.get('#graphContainer text').should(elements => {
      const lines = Array.from(elements, element => element.textContent);
      expect(lines).to.include('Supervisor, Leon,');
      expect(lines).to.include('Intern "Wenhao"');
    });
    cy.contains('#graphContainer text', 'Supervisor, Leon').dblclick({force: true});
    cy.get('.mxCellEditor').type('{selectall}"Supervisor, Leon", "Intern, Wenhao"{enter}');
    cy.window().should(window => {
      const tabs = JSON.parse(window.localStorage.getItem('ammber/tabData')!);
      expect(tabs.find((tab: {label: string}) => tab.label === 'Who').rows.map((goal: {content: string}) => goal.content))
        .to.deep.equal(['Supervisor, Leon', 'Intern, Wenhao']);
    });
  });

  it('rejects an empty list item without changing model text', () => {
    cy.contains('#graphContainer li', concerns[0].content).dblclick({force: true});
    cy.get('.mxCellEditor li').first().then(items => { items[0].textContent = ''; });
    cy.get('#graphContainer').click(5, 5, {force: true});
    cy.contains('Goal name cannot be empty.').should('be.visible');
    cy.window().should(window => {
      const tabs = JSON.parse(window.localStorage.getItem('ammber/tabData')!);
      expect(tabs.find((tab: {label: string}) => tab.label === 'Concern').rows[0].content).to.equal(concerns[0].content);
    });
  });

  it('keeps a multi-item concern list inside the shape while editing', () => {
    cy.contains('#graphContainer li', concerns[0].content).then(($item) => {
      cy.wrap(parseFloat(getComputedStyle($item[0]).fontSize)).as('displayFontSize');
      cy.wrap($item).dblclick({force: true});
    });

    cy.get('.mxCellEditor')
      .should('be.visible')
      .and('have.css', 'overflow', 'auto')
      .find('li')
      .should('have.length', concerns.length)
      .then(($items) => {
        expect(Array.from($items, item => item.textContent?.trim())).to.deep.equal(
          concerns.map(concern => concern.content),
        );
      });
    cy.get('.mxCellEditor li').first()
      .should('have.css', 'list-style-type', 'disc')
      .then(($item) => {
        cy.get('@displayFontSize').then((fontSize) => {
          expect(parseFloat(getComputedStyle($item[0]).fontSize)).to.equal(Number(fontSize));
        });
      });

    cy.get('.mxCellEditor').then(($editor) => {
      const editorBounds = $editor[0].getBoundingClientRect();

      cy.get('#graphContainer rect[fill="#00ff00"]').then(($handles) => {
        const handleBounds = Array.from($handles, handle => handle.getBoundingClientRect());
        const left = Math.min(...handleBounds.map(bounds => bounds.left + bounds.width / 2));
        const right = Math.max(...handleBounds.map(bounds => bounds.left + bounds.width / 2));
        const top = Math.min(...handleBounds.map(bounds => bounds.top + bounds.height / 2));
        const bottom = Math.max(...handleBounds.map(bounds => bounds.top + bounds.height / 2));

        expect(editorBounds.left).to.be.at.least(left);
        expect(editorBounds.right).to.be.at.most(right);
        expect(editorBounds.top).to.be.at.least(top);
        expect(editorBounds.bottom).to.be.at.most(bottom);
      });
    });

    cy.contains('.mxCellEditor li', concerns[1].content)
      .click()
      .type('{end}, updated');
    cy.get('#graphContainer').click(5, 5, {force: true});

    cy.get('.mxCellEditor').should('not.exist');
    cy.contains('#graphContainer li', `${concerns[1].content}, updated`).should('be.visible');
    cy.get('#graphContainer li').should('have.length', concerns.length);
  });
});
