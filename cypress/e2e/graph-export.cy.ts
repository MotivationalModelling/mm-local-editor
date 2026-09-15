type ExportedFile = {
  name: string;
  data: Blob | string;
};

describe('Graph export tests', () => {
  for (const extended of [false, true]) {
    it(extended ? 'exports edited multi-item labels and updates model state' : 'exports list labels to PNG while preserving SVG export', () => {
      const exportedFiles: ExportedFile[] = [];
      let visibleLabels: string[] = [];

      if (extended) {
        const root = {id: 1, content: 'Root goal', type: 'Do', instanceId: '1:1', children: []};
        const goals = ['Be', 'Feel', 'Concern'].flatMap((type, group) =>
          ['Independent & responsible', 'Learn <practice> "safely"', '中文 😀 reflection'].map((text, index) => ({
            id: 2 + group * 3 + index, content: `${type} ${text}`, type,
            instanceId: `${2 + group * 3 + index}:1`, children: [],
          })));
        cy.visit('/projectEdit', {onBeforeLoad(window) {
          window.localStorage.setItem('ammber/treeData', JSON.stringify([root, ...goals]));
          window.localStorage.setItem('ammber/tabData', JSON.stringify(
            ['Do', 'Be', 'Feel', 'Concern', 'Who'].map(label => ({
              label, icon: '', rows: label === 'Do' ? [root] : goals.filter(goal => goal.type === label),
            })),
          ));
        }});
      } else {
        cy.visit('/');
        cy.contains('Create Model').click();
      }

      cy.window().then((window) => {
        Object.defineProperty(window, 'showSaveFilePicker', {
          configurable: true,
          value: async (options: SaveFilePickerOptions) => ({
            createWritable: async () => ({
              write: async (data: Blob | string) => {
                exportedFiles.push({
                  name: options.suggestedName ?? '',
                  data,
                });
              },
              close: async () => undefined,
            }),
          }),
        });
      });

      cy.get('#graphTab').click();
      cy.get('#graphContainer li').should('have.length', extended ? 9 : 3);
      if (extended) {
        // Cancel must preserve the model; a subsequent commit must save fresh input.
        cy.contains('#graphContainer li', 'Concern Independent').dblclick({force: true});
        cy.get('.mxCellEditor li').first().click().type('{end} cancelled');
        cy.get('.mxCellEditor').type('{esc}');
        cy.contains('#graphContainer li', 'cancelled').should('not.exist');
        cy.contains('#graphContainer li', 'Concern Independent').dblclick({force: true});
        cy.get('.mxCellEditor li').first().click().type('{end} updated');
        cy.get('.mxCellEditor').type('{enter}');
        cy.contains('#graphContainer li', 'Concern Independent & responsible updated').should('be.visible');
      }
      cy.get('#graphContainer li').then(($labels) => {
        visibleLabels = Array.from($labels).map(label => label.textContent ?? '');
      });

      cy.contains('Export').click();
      cy.contains('Export as SVG').click();
      cy.wrap(null).should(() => {
        expect(exportedFiles.some(file => file.name === 'Graph.svg')).to.equal(true);
      });
      cy.contains('Export').click();
      cy.contains('Export as PNG').click();
      cy.wrap(null).should(() => {
        expect(exportedFiles.some(file => file.name === 'Graph.png')).to.equal(true);
      });

      cy.get('#graphContainer svg').then(($svg) => {
        const svg = $svg[0] as unknown as SVGSVGElement;
        const svgRect = svg.getBoundingClientRect();
        const labelRects = Array.from(svg.querySelectorAll('li')).map(label => {
          const rect = label.getBoundingClientRect();
          return {
            x: rect.left - svgRect.left,
            y: rect.top - svgRect.top,
            width: rect.width,
            height: rect.height,
          };
        });
        const png = exportedFiles.find(file => file.name === 'Graph.png')!.data as Blob;

        return cy.window().then(async (window) => {
          // Image coordinates now start at the full-model viewBox, not the
          // visible canvas origin. Use the independently exported SVG bounds.
          const svgFile = exportedFiles.find(file => file.name === 'Graph.svg')!.data as Blob;
          const parsed = new window.DOMParser().parseFromString(await svgFile.text(), 'image/svg+xml');
          const bounds = parsed.documentElement.getAttribute('viewBox')!.split(' ').map(Number);
          const imageUrl = window.URL.createObjectURL(png);
          const image = new window.Image();
          image.src = imageUrl;
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Failed to load exported PNG'));
          });

          const canvas = window.document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          const scaleX = image.naturalWidth / bounds[2];
          const scaleY = image.naturalHeight / bounds[3];
          expect(image.naturalWidth).to.equal(Math.round(bounds[2] * 3));
          expect(image.naturalHeight).to.equal(Math.round(bounds[3] * 3));
          expect(Array.from(context.getImageData(0, 0, 1, 1).data)).to.deep.equal([255, 255, 255, 255]);

          labelRects.forEach(rect => {
            const pixels = context.getImageData(
              Math.max(0, Math.floor((rect.x - bounds[0]) * scaleX)),
              Math.max(0, Math.floor((rect.y - bounds[1]) * scaleY)),
              Math.max(1, Math.ceil(rect.width * scaleX)),
              Math.max(1, Math.ceil(rect.height * scaleY)),
            ).data;
            let darkPixels = 0;

            for (let index = 0; index < pixels.length; index += 4) {
              if (pixels[index + 3] === 255 && pixels[index] < 80 && pixels[index + 1] < 80 && pixels[index + 2] < 80) {
                darkPixels++;
              }
            }

            expect(darkPixels).to.be.greaterThan(5);
          });

          window.URL.revokeObjectURL(imageUrl);
        });
      });

      // PNG preparation must not add export-only elements to the live graph.
      cy.get('#graphContainer svg > rect[fill="white"]').should('not.exist');

      cy.contains('Export').click();
      cy.contains('Export as SVG').click();
      cy.wrap(null).should(() => {
        expect(exportedFiles.some(file => file.name === 'Graph.svg')).to.equal(true);
      });
      cy.then(async () => {
        const svg = exportedFiles.find(file => file.name === 'Graph.svg')!.data as Blob;
        const svgText = await svg.text();

        expect(svgText).to.include('foreignObject');
        const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        expect(Array.from(parsed.querySelectorAll('li'), item => item.textContent)).to.deep.equal(visibleLabels);
      });
      if (extended) {
        // Check the application state, not just maxGraph's displayed value.
        // File-save serialization is a separate pipeline from image export.
        cy.window().should(window => {
          const tabs = JSON.parse(window.localStorage.getItem('ammber/tabData')!);
          const concern = tabs.find((tab: {label: string}) => tab.label === 'Concern');
          expect(concern.rows.map((goal: {content: string}) => goal.content)).to.deep.equal([
            'Concern Independent & responsible updated',
            'Concern Learn <practice> "safely"',
            'Concern 中文 😀 reflection',
          ]);
        });
      }
    });
  }
});
