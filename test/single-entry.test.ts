import path from 'path';
import { compile } from './utils/compile';
import { DIR, ufs } from './utils/ufs';

describe('single entry', () => {
    const entry = path.resolve(DIR, 'test.less');

    it('no imports', async () => {
        ufs.writeFileSync(
            entry,
            `
            .test { color: red; }
            `
        );

        const [output] = await compile({ entry });
        expect(output).toMatch(/\.test\s+\{/);
    });

    it('simple import', async () => {
        ufs.writeFileSync(
            entry,
            `
            @import 'button.less';
            .test { color: red; }
            `
        );

        const [output] = await compile({ entry });
        expect(output).toMatch(/\.button\s+\{/);
        expect(output).toMatch(/\.test\s+\{/);
    });

    it('duplicate imports', async () => {
        ufs.writeFileSync(
            entry,
            `
            @import 'button.less';
            @import 'button.less';
            .test { color: red; }
            `
        );

        const [output] = await compile({ entry });
        expect([...output.matchAll(/\.button\s+\{/g)]).toHaveLength(1);
    });

    const entries = [entry, path.resolve(DIR, 'test2.less')];

    it('simple imports in separate files', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import 'input.less';
            @import 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import 'input.less';
            @import 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(2);

        expect(output[0]).toMatch(/\.input\s+\{/);
        expect(output[0]).toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);

        expect(output[1]).toMatch(/\.input\s+\{/);
        expect(output[1]).toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
    });

    it('import once', async () => {
        ufs.writeFileSync(
            entry,
            `
                @import (once) 'button.less';
                .test { color: red; }
                `
        );

        const [output] = await compile({ entry });
        expect(output).toMatch(/\.button\s+\{/);
    });

    it('import once in separate files', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import (once) 'input.less';
            @import (once) 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import (once) 'input.less';
            @import (once) 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(2);

        expect(output[0]).toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[1]).toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);

        // one of the files should have the input class, the other should not
        if (output[0].match(/\.input\s+\{/)) {
            expect(output[1]).not.toMatch(/\.input\s+\{/);
        } else {
            expect(output[1]).toMatch(/\.input\s+\{/);
        }
    });

    it('import once, incremental build', async () => {
        ufs.writeFileSync(
            entry,
            `
            @import (once) 'input.less';
            @import (once) 'button.less';
            .test { color: red; }
            `
        );

        await compile({ entry });
        const output = await compile({ entry }, {}, {}, true);
        expect(output).toHaveLength(1);

        expect(output[0]).toMatch(/\.input\s+\{/);
        expect(output[0]).toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
    });

    const rxInputImport = /import ___CSS_LOADER_AT_RULE_IMPORT_0___ from "[^"]+\.\/input\.less";/;
    const rxButtonImport = /import ___CSS_LOADER_AT_RULE_IMPORT_[01]___ from "[^"]+\.\/button\.less";/;
    const rxCheckboxImport = /import ___CSS_LOADER_AT_RULE_IMPORT_[01]___ from "[^"]+\.\/checkbox\.less";/;

    it('css imports in separate files', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import (css) 'input.less';
            @import (css) 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import (css) 'input.less';
            @import (css) 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(5);

        expect(output[0]).not.toMatch(/\.input\s+\{/);
        expect(output[0]).not.toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[0]).toMatch(rxInputImport);
        expect(output[0]).toMatch(rxButtonImport);

        expect(output[1]).not.toMatch(/\.input\s+\{/);
        expect(output[1]).not.toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[1]).toMatch(rxInputImport);
        expect(output[1]).toMatch(rxCheckboxImport);

        expect(output[2]).toMatch(/\.input\s+\{/);
        expect(output[3]).toMatch(/\.button\s+\{/);
        expect(output[4]).toMatch(/\.checkbox\s+\{/);
    });

    it('css+once imports in separate files', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import (css,once) 'input.less';
            @import (css,once) 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import (once,css) 'input.less';
            @import (once,css) 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(5);

        expect(output[0]).not.toMatch(/\.input\s+\{/);
        expect(output[0]).not.toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[0]).toMatch(rxButtonImport);

        expect(output[1]).not.toMatch(/\.input\s+\{/);
        expect(output[1]).not.toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[1]).toMatch(rxCheckboxImport);

        // one of the files should have the input class, the other should not
        if (output[0].match(rxInputImport)) {
            expect(output[1]).not.toMatch(rxInputImport);
        } else {
            expect(output[1]).toMatch(rxInputImport);
        }
    });

    it('css+reference imports in separate files', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import (css,reference) 'input.less';
            @import (reference,css) 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import (reference,css) 'input.less';
            @import (css,reference) 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(2);

        expect(output[0]).not.toMatch(/\.input\s+\{/);
        expect(output[0]).not.toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[0]).not.toMatch(rxInputImport);
        expect(output[0]).not.toMatch(rxButtonImport);

        expect(output[1]).not.toMatch(/\.input\s+\{/);
        expect(output[1]).not.toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[1]).not.toMatch(rxInputImport);
        expect(output[1]).not.toMatch(rxCheckboxImport);
    });

    it('css+once+reference imports in separate files', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import (css,once,reference) 'input.less';
            @import (css,reference,once) 'button.less';
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import (once,reference,css) 'input.less';
            @import (once,css,reference) 'checkbox.less';
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(2);

        expect(output[0]).not.toMatch(/\.input\s+\{/);
        expect(output[0]).not.toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[0]).not.toMatch(rxInputImport);
        expect(output[0]).not.toMatch(rxButtonImport);

        expect(output[1]).not.toMatch(/\.input\s+\{/);
        expect(output[1]).not.toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[1]).not.toMatch(rxInputImport);
        expect(output[1]).not.toMatch(rxCheckboxImport);
    });

    it('once imports with double quotes', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import (css,once) "input.less";
            @import (css,once) "button.less";
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import (once,css) "input.less";
            @import (once,css) "checkbox.less";
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(5);

        expect(output[0]).not.toMatch(/\.input\s+\{/);
        expect(output[0]).not.toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[0]).toMatch(rxButtonImport);

        expect(output[1]).not.toMatch(/\.input\s+\{/);
        expect(output[1]).not.toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[1]).toMatch(rxCheckboxImport);

        // one of the files should have the input class, the other should not
        if (output[0].match(rxInputImport)) {
            expect(output[1]).not.toMatch(rxInputImport);
        } else {
            expect(output[1]).toMatch(rxInputImport);
        }
    });

    it('once imports with url', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import (css,once) url(input.less);
            @import (css,once) url(button.less);
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import (once,css) url(input.less);
            @import (once,css) url(checkbox.less);
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(5);

        expect(output[0]).not.toMatch(/\.input\s+\{/);
        expect(output[0]).not.toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[0]).toMatch(rxButtonImport);

        expect(output[1]).not.toMatch(/\.input\s+\{/);
        expect(output[1]).not.toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[1]).toMatch(rxCheckboxImport);

        // one of the files should have the input class, the other should not
        if (output[0].match(rxInputImport)) {
            expect(output[1]).not.toMatch(rxInputImport);
        } else {
            expect(output[1]).toMatch(rxInputImport);
        }
    });

    it('once imports with url and quotes', async () => {
        ufs.writeFileSync(
            entries[0],
            `
            @import (css,once) url('input.less');
            @import (css,once) url("button.less");
            .test { color: red; }
            `
        );

        ufs.writeFileSync(
            entries[1],
            `
            @import (once,css) url("input.less");
            @import (once,css) url('checkbox.less');
            .test2 { color: blue; }
            `
        );

        const output = await compile({ entry: entries });
        expect(output).toHaveLength(5);

        expect(output[0]).not.toMatch(/\.input\s+\{/);
        expect(output[0]).not.toMatch(/\.button\s+\{/);
        expect(output[0]).toMatch(/\.test\s+\{/);
        expect(output[0]).toMatch(rxButtonImport);

        expect(output[1]).not.toMatch(/\.input\s+\{/);
        expect(output[1]).not.toMatch(/\.checkbox\s+\{/);
        expect(output[1]).toMatch(/\.test2\s+\{/);
        expect(output[1]).toMatch(rxCheckboxImport);

        // one of the files should have the input class, the other should not
        if (output[0].match(rxInputImport)) {
            expect(output[1]).not.toMatch(rxInputImport);
        } else {
            expect(output[1]).toMatch(rxInputImport);
        }
    });
});
