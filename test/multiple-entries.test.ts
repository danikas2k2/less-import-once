import path from 'path';
import { compile } from './utils/compile';
import { DIR, ufs } from './utils/ufs';

describe('multiple entries', () => {
    const entry = {
        first: path.resolve(DIR, 'test.less'),
        second: [path.resolve(DIR, 'test2.less'), path.resolve(DIR, 'test3.less')],
    };

    it('no imports', async () => {
        ufs.writeFileSync(
            entry.first,
            `
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entry.second[0],
            `
            .test2 { color: blue; }
            `
        );

        ufs.writeFileSync(
            entry.second[1],
            `
            .test3 { color: green; }
            `
        );

        const output = await compile({ entry });
        expect(output).toHaveLength(3);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[2]).toMatch(/\.test3\s+\{/);
    });

    it('simple imports', async () => {
        ufs.writeFileSync(
            entry.first,
            `
            @import 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entry.second[0],
            `
            @import 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        ufs.writeFileSync(
            entry.second[1],
            `
            @import 'button.less';
            .test3 { color: green; }
            `
        );

        const output = await compile({ entry });
        expect(output).toHaveLength(3);

        expect(output[0]).toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);

        expect(output[1]).toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);

        expect(output[2]).toMatch(/\.button\s+\{/);
        expect(output[2]).toMatch(/\.test3\s+\{/);
    });

    it('simple imports in separate files', async () => {
        ufs.writeFileSync(
            entry.first,
            `
            @import 'input.less';
            @import 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entry.second[0],
            `
            @import 'input.less';
            @import 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        ufs.writeFileSync(
            entry.second[1],
            `
            @import 'input.less';
            @import 'button.less';
             .test3 { color: green; }
            `
        );

        const output = await compile({ entry });
        expect(output).toHaveLength(3);

        expect(output[0]).toMatch(/\.input\s+\{/);
        expect(output[0]).toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);

        expect(output[1]).toMatch(/\.input\s+\{/);
        expect(output[1]).toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);

        expect(output[2]).toMatch(/\.input\s+\{/);
        expect(output[2]).toMatch(/\.button\s+\{/);
        expect(output[2]).toMatch(/\.test3\s+\{/);
    });

    it('import once in separate files', async () => {
        ufs.writeFileSync(
            entry.first,
            `
            @import (once) 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entry.second[0],
            `
            @import (once) 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        ufs.writeFileSync(
            entry.second[1],
            `
            @import (once) 'button.less';
             .test3 { color: green; }
            `
        );

        const output = await compile({ entry });
        expect(output).toHaveLength(3);

        const indexWithCheckbox = output.findIndex((o) => o.match(/\.checkbox\s+\{/));
        expect(indexWithCheckbox).toBeGreaterThan(-1);
        expect(output[indexWithCheckbox]).toMatch(/\.test2\s+\{/);
        output.splice(indexWithCheckbox, 1);

        const indexWithButton = output.findIndex((o) => o.match(/\.button\s+\{/));
        expect(indexWithButton).toBeGreaterThan(-1);
        expect(output[1 - indexWithButton]).not.toMatch(/\.button\s+\{/);

        const indexWithTest = output.findIndex((o) => o.match(/\.test\s+\{/));
        expect(output[indexWithTest]).not.toMatch(/\.test3\s+\{/);
        expect(output[1 - indexWithTest]).toMatch(/\.test3\s+\{/);
        expect(output[1 - indexWithTest]).not.toMatch(/\.test\s+\{/);
    });
});
