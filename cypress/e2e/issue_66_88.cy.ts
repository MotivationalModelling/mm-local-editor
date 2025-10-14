import '@4tw/cypress-drag-drop'

describe('Goal Input Automation', () => {
    const doList = ["Do exercise", "Do shopping", "Do swimming"];
    
    before(() => {
      cy.visit("http://localhost:5173/mm-local-editor/");
      cy.contains("button", "Create Model").click();
    });
  
    function clickGoalList(iconAlt: string): void {
      cy.scrollTo('top');
      cy.get(`img[alt="${iconAlt}"]`)
        .should('exist')
        .scrollIntoView()
        .should("be.visible")
        .parent() // get the <a> or clickable container
        .click({ force: true });
    }
  
  
    function enterGoals(goals: string[], startIndex: number = 0): void {
      goals.forEach((goal, index) => {
        const actualIndex = startIndex + index;
        cy.get("div.input-group input.form-control")
          .eq(actualIndex)
          .should("be.visible")
          .click()
          .clear()
          .type(goal)
          .should("have.value", goal)
          .type("{enter}{enter}");
        cy.wait(500);
      });
      
    }

    function addGoalsToHierarchy(tabName: string): void {
        cy.scrollTo('top');
        cy.get(`[id$="-tabpane-${tabName}"]`) // Matches any ID ending with -tabpane-Do
        .find('th[style="width: 1px; white-space: nowrap;"] input.form-check-input')
        .should('be.visible')
        .click();

        cy.contains("button", "Add Group").click();
        cy.wait(500);
    }

    function dragGoalToHierarchy(): void {
        cy.get('input.form-control[draggable="true"][type="text"]:not(.text-muted)')
        .filter(':visible')
        .eq(0) // gets the 1st element (0-based index)
        .drag('#root > div:nth-child(1) > div > div:nth-child(3) > div:nth-child(2)');
    }

    // Bug: not allow duplicate goals to be placed in the Hierarchy
    // Issue #88, #66: https://github.com/MotivationalModelling/mm-local-editor/issues/88
    it("drag an existing goal to the hierarchy", () => {
      // Click on the Do tab
      clickGoalList("Do icon");
      // Enter some different Do goals
      enterGoals(doList, 0);
      // Add all Do goals to the Hierarchy
      addGoalsToHierarchy("Do");
      // Drag the "Do excercise" goal to the Hierarchy
      dragGoalToHierarchy();
      // Search for all items in the Hierarchy having the text of "Do exercise"
      // If it is correctly implemented, the number of items should be 2 
      // (allowing duplicates in the Hierarchy as expected result)
      cy.get('.nestable-item-name .tree-list div').then($divs => {
        const divs = [...$divs];

        // Get all indexes where text matches exactly "Do exercise"
        const indexes = divs
            .map((div, i) => div.textContent?.trim() === "Do exercise" ? i : -1)
            .filter(i => i !== -1);

        // Assert the count is exactly 2 (allowing a duplicate goal in the hierarchy)
        expect(indexes.length).to.eq(2);
      });
    });
  });
