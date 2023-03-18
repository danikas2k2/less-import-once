import fs from 'fs';
import { Volume } from 'memfs';
import { Union } from 'unionfs';
import type { Configuration, WebpackOptionsValidationError } from 'webpack';
import compiler from './compiler';

const vol = new Volume();
vol.fromJSON(
    {
        'test.less': '',
        'test2.less': '',
        'test3.less': '',
    },
    './test'
);

const ufs = new Union();
ufs.use(fs);
ufs.use(vol as any);

describe('webpack.lessImportOnce', () => {
    describe('single entry', () => {
        const entry = './test.less';

        it('no imports', async () => {
            source(
                './test/test.less',
                `
                .test { color: red; }
                `
            );

            const [output] = await compile({ entry });
            expect(output).toMatch(/\.test\s+\{/);
        });

        it('simple import', async () => {
            source(
                './test/test.less',
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
            source(
                './test/test.less',
                `
                @import 'button.less';
                @import 'button.less';
                .test { color: red; }
                `
            );

            const [output] = await compile({ entry });
            expect([...output.matchAll(/\.button\s+\{/g)]).toHaveLength(1);
        });

        const entries = ['./test.less', './test2.less'];

        it('simple imports in separate files', async () => {
            source(
                './test/test.less',
                `
                @import 'input.less';
                @import 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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
            source(
                './test/test.less',
                `
                    @import (once) 'button.less';
                    .test { color: red; }
                    `
            );

            const [output] = await compile({ entry });
            expect(output).toMatch(/\.button\s+\{/);
        });

        it('import once in separate files', async () => {
            source(
                './test/test.less',
                `
                @import (once) 'input.less';
                @import (once) 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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
            source(
                './test/test.less',
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
            source(
                './test/test.less',
                `
                @import (css) 'input.less';
                @import (css) 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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
            source(
                './test/test.less',
                `
                @import (css,once) 'input.less';
                @import (css,once) 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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
            source(
                './test/test.less',
                `
                @import (css,reference) 'input.less';
                @import (reference,css) 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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
            source(
                './test/test.less',
                `
                @import (css,once,reference) 'input.less';
                @import (css,reference,once) 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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
            source(
                './test/test.less',
                `
                @import (css,once) "input.less";
                @import (css,once) "button.less";
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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
            source(
                './test/test.less',
                `
                @import (css,once) url(input.less);
                @import (css,once) url(button.less);
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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
            source(
                './test/test.less',
                `
                @import (css,once) url('input.less');
                @import (css,once) url("button.less");
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
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

    describe('multiple entries', () => {
        const entry = {
            first: './test.less',
            second: ['./test2.less', './test3.less'],
        };

        it('no imports', async () => {
            source(
                './test/test.less',
                `
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
                `
                .test2 { color: blue; }
                `
            );

            source(
                './test/test3.less',
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
            source(
                './test/test.less',
                `
                @import 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
                `
                @import 'checkbox.less';
                .test2 { color: blue; }
                `
            );

            source(
                './test/test3.less',
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
            source(
                './test/test.less',
                `
                @import 'input.less';
                @import 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
                `
                @import 'input.less';
                @import 'checkbox.less';
                .test2 { color: blue; }
                `
            );

            source(
                './test/test3.less',
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
            source(
                './test/test.less',
                `
                @import (once) 'button.less';
                .test { color: red; }
                `
            );

            source(
                './test/test2.less',
                `
                @import (once) 'checkbox.less';
                .test2 { color: blue; }
                `
            );

            source(
                './test/test3.less',
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

    describe('handle errors', () => {
        it('should throw error on disabled cache', async () => {
            expect.assertions(1);
            try {
                await compile({ entry: './test.less' }, {}, { cache: false });
            } catch (e: WebpackOptionsValidationError | WebpackOptionsValidationError[]) {
                expect((e.length ? e[0] : e).message).toContain('requires webpack cache to be enabled');
            }
        });
    });
});

function source(file: string, src: string): void {
    ufs.writeFileSync(file, src.trim().replace(/\s+/g, ' '));
}

async function compile(
    config: Configuration = {},
    loaderOptions = {},
    webpackOptions = {},
    incremental = false
): Promise<string[]> {
    const stats = await compiler(config, loaderOptions, webpackOptions, incremental, ufs);
    const json = stats?.toJson({ source: true });
    return json?.modules?.filter((m) => m?.name?.endsWith('.less')).map((m) => m!.source!.toString()) ?? [];
}
