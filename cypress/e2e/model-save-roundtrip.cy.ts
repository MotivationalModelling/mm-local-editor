type SavedModel = {
  tabData: unknown[];
  treeData: Array<{id: number; content: string; type: string; instanceId: string; children?: SavedModel['treeData']}>;
};

const exampleModel: SavedModel = {
  tabData: ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(label => ({
    label, icon: '', goalIds: label === 'Do' ? [1] : label === 'Be' ? [2, 3, 4] : [],
  })),
  treeData: [
    {id: 1, content: 'Root goal', type: 'Do', instanceId: '1:1', children: []},
    ...['Independent', 'Responsible', 'Able to learn from mistake'].map((content, index) => ({
      id: index + 2, content, type: 'Be', instanceId: `${index + 2}:1`, children: [],
    })),
  ],
};

const fitModelInViewport = () => {
  // The middle Zoom control fits/centres the graph without changing model data.
  cy.contains('.card-subtitle', 'Zoom').closest('.card').find('button').eq(1).click();
};

const openModel = (contents: string, onBeforeLoad?: (window: Cypress.AUTWindow) => void) => {
  cy.visit('/', {onBeforeLoad});
  cy.contains('button', 'Open Model').click();
  cy.get('input[type="file"]').selectFile({
    contents: Cypress.Buffer.from(contents), fileName: 'roundtrip.json', mimeType: 'application/json',
  }, {force: true});
  cy.contains('button', /^Upload$/).should('be.enabled').click();
  cy.get('#graphTab').click();
  fitModelInViewport();
};

const verifyEditedModelRoundTrip = (input: string, finishEditingFirst = true, resizeBeforeEdit = false) => {
  let saved = '';
  const flattenTree = (nodes: SavedModel['treeData']): SavedModel['treeData'] =>
    nodes.flatMap(node => [node, ...flattenTree(node.children ?? [])]);
  const originalLabel = flattenTree(JSON.parse(input).treeData)
    .find(node => node.type === 'Be' && node.content.startsWith('Able to learn'))!.content;
  const editedLabel = originalLabel === 'Able to learn' ? 'Able to' : 'Able to learn';
  let savedBounds: {x: number; y: number; width: number; height: number};
  let savedLayout: unknown;
  // Locate this label's own shape and measure SVG units, not screen pixels.
  const shapeBounds = (label: HTMLElement) => {
    let group = label.closest('foreignObject')?.parentElement;
    while (group && !group.querySelector('path[fill]:not([fill="none"])')) group = group.parentElement;
    const box = (group!.querySelector('path[fill]:not([fill="none"])') as SVGGraphicsElement).getBBox();
    return {x: box.x, y: box.y, width: box.width, height: box.height};
  };
  const captureFileWrites = (window: Cypress.AUTWindow) => {
    // The app gates Save by browser name. Headless Chrome/Electron uses a
    // supported Chrome identity here; file writes are captured, never native.
    Object.defineProperty(window.navigator, 'userAgent', {
      value: window.navigator.userAgent.replace(/Electron\/\S+\s*/g, '').replace('HeadlessChrome', 'Chrome'),
    });
    Object.defineProperty(window, 'showSaveFilePicker', {value: async () => ({
      createWritable: async () => ({
        write: async (data: string) => { saved = data; },
        close: async () => undefined,
        abort: async () => undefined,
      }),
    })});
  };
  openModel(input, captureFileWrites);
  if (resizeBeforeEdit) {
    cy.contains('#graphContainer li', originalLabel).click({force: true});
    cy.get('#graphContainer rect[fill="#00ff00"]').should('have.length', 8).last().then(handle => {
      const rect = handle[0].getBoundingClientRect();
      const startX = rect.x + rect.width / 2;
      const startY = rect.y + rect.height / 2;
      const pointer = {button: 0, buttons: 1, pointerId: 1, pointerType: 'mouse', force: true};
      cy.wrap(handle).trigger('pointerdown', {...pointer, clientX: startX, clientY: startY});
      cy.document().trigger('pointermove', {...pointer, clientX: startX + 100, clientY: startY + 50});
      cy.document().trigger('pointerup', {...pointer, buttons: 0, clientX: startX + 100, clientY: startY + 50});
    });
  }
  cy.contains('#graphContainer li', originalLabel).dblclick({force: true});
  const removedSuffix = originalLabel.slice(editedLabel.length);
  cy.contains('.mxCellEditor li', originalLabel).click()
    .type('{end}' + '{backspace}'.repeat(removedSuffix.length));
  if (finishEditingFirst) {
    cy.get('#graphContainer').click(5, 5, {force: true});
    cy.get('.mxCellEditor').should('not.exist');
    fitModelInViewport();
    cy.contains('#graphContainer li', editedLabel).scrollIntoView().should('be.visible');
  }
  cy.contains('button', /^Save$/).click();
  cy.get('.mxCellEditor').should('not.exist');
  cy.wrap(null).should(() => {
    expect(saved).not.to.equal('');
    expect(saved).not.to.include(originalLabel);
    expect(saved).to.include(editedLabel);
    expect(Object.keys(JSON.parse(saved).nonFunctionalLayout)).not.to.have.length(0);
  });
  fitModelInViewport();
  cy.contains('#graphContainer li', editedLabel).should(label => {
    expect(shapeBounds(label[0]).width).to.be.greaterThan(0);
  }).then(label => { savedBounds = shapeBounds(label[0]); });
  cy.then(() => {
    savedLayout = JSON.parse(saved).nonFunctionalLayout;
    openModel(saved, captureFileWrites);
  });
  cy.contains('#graphContainer li', editedLabel).scrollIntoView().should('be.visible').should(label => {
    const bounds = shapeBounds(label[0]);
    // Auto-fit can change screen scale/translation. Compare visual proportions,
    // then resave below to verify exact model-unit position and dimensions.
    expect(bounds.width / bounds.height, 'reopened cloud aspect ratio')
      .to.be.closeTo(savedBounds.width / savedBounds.height, 0.001);
  });
  cy.contains('#graphContainer li', originalLabel).should('not.exist');
  cy.get('#graphContainer li').should('have.length.at.least', 3);
  cy.then(() => { saved = ''; });
  cy.contains('button', /^Save$/).click();
  cy.wrap(null).should(() => {
    expect(saved).not.to.equal('');
    expect(JSON.parse(saved).nonFunctionalLayout).to.deep.equal(savedLayout);
  });
};

describe('Model JSON save and reopen', () => {
  it('preserves edited text after saving and reopening current IDs', () => {
    verifyEditedModelRoundTrip(JSON.stringify(exampleModel));
  });

  it('upgrades legacy IDs and preserves edited text after reopening', () => {
    const legacy = JSON.stringify(exampleModel).replace(/(\d+):(\d+)/g, '$1-$2');
    verifyEditedModelRoundTrip(legacy);
  });

  it('saves the latest input when Save is clicked directly from the editor', () => {
    verifyEditedModelRoundTrip(JSON.stringify(exampleModel), false);
  });

  it('preserves manually resized cloud geometry through editing and reopening', () => {
    verifyEditedModelRoundTrip(JSON.stringify(exampleModel), true, true);
  });

  // Optional local diagnostic: no user model contents are committed as fixtures.
  const userModelPath = Cypress.env('userModelPath') as string | undefined;
  if (userModelPath) {
    it('round-trips the supplied user model without modifying the source file', () => {
      cy.readFile(userModelPath).then(model => verifyEditedModelRoundTrip(JSON.stringify(model)));
    });
  }
});
