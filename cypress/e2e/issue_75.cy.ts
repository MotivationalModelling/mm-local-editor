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

    // Bug: user can still export file even if the hierarchy is empty
    // Issue #75: https://github.com/MotivationalModelling/mm-local-editor/issues/75
    it("export without hierarchy/model validation", () => {
      //Add some Do goals
      clickGoalList("Do icon");
      enterGoals(doList, 0);
      //Check if the Export button is greyed out/disabled when the Hierarchy is still empty
      cy.contains('button', 'Export').should('be.disabled');
    })
});

