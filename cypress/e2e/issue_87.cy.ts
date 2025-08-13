describe('Goal Input Automation', () => {
    const feelList = ["Feel valued", "Feel valued", "Feel valued"];
    
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

    // Bug: duplicate goals are still allowed in the same category of the Goal List
    // Issue #87: https://github.com/MotivationalModelling/mm-local-editor/issues/87
    it("add duplicate goals", () => {
      // Click on the Feel tab
      clickGoalList("Feel icon");
      // Enter three Feel goals of the same value
      enterGoals(feelList, 2);
      // Check to ensure that there is only one Feel goal is added
      // If the bug is fixed
      cy.get('div.input-group input.form-control')
      .filter((_, el) => (el as HTMLInputElement).value === 'Feel valued')
      .should('have.length', 1);

    });
  });
