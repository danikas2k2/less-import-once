import path from 'path';
import { compile } from './utils/compile';
import { DIR, ufs } from './utils/ufs';

describe('multiple entries', () => {
    const first = path.resolve(DIR, 'test.less');
    const second = path.resolve(DIR, 'test2.less');
    const third = path.resolve(DIR, 'test3.less');
    const entry = {
        first,
        second: [second, third],
    };

    it('no imports', async () => {
        ufs.writeFileSync(first, `.test { color: red; }`);
        ufs.writeFileSync(second, `.test2 { color: blue; }`);
        ufs.writeFileSync(third, `.test3 { color: green; }`);

        const output = await compile({ entry });
        expect(output).toHaveLength(3);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[2]).toMatch(/\.test3\s+\{/);
    });

    it('simple imports', async () => {
        ufs.writeFileSync(
            first,
            `
            @import 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            second,
            `
            @import 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        ufs.writeFileSync(
            third,
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
            first,
            `
            @import 'input.less';
            @import 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            second,
            `
            @import 'input.less';
            @import 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        ufs.writeFileSync(
            third,
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
            first,
            `
            @import (once) 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            second,
            `
            @import (once) 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        ufs.writeFileSync(
            third,
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
