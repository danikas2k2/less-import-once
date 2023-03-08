import type { LoaderContext } from 'webpack';
import lessImportOnce from './loader';

describe('webpack.lessImportOnce', () => {
    const context = {
        resourcePath: 'test.less',
    } as LoaderContext<object>;

    it('without import', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
.Button { font-weight: bold; }
`);
    });

    it('with simple import', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with duplicate simple imports', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import 'button.less';
@import 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import 'button.less';
@import 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with simple imports in separate files', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import 'input.less';
@import 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import 'input.less';
@import 'button.less';
.Button { font-weight: bold; }
`);
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import 'input.less';
@import 'checkbox.less';
.Checkbox { border: 1px solid black; }
`)
                )
                ?.toString()
        ).toBe(`
@import 'input.less';
@import 'checkbox.less';
.Checkbox { border: 1px solid black; }
`);
    });

    it('with (once) import', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with duplicate (once) imports', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) 'button.less';
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with (once) imports in separate files', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) 'input.less';
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) 'input.less';
@import (once) 'button.less';
.Button { font-weight: bold; }
`);
        expect(
            lessImportOnce
                .call(
                    { ...context, resourcePath: 'different.less' },
                    Buffer.from(`
@import (once) 'input.less';
@import (once) 'checkbox.less';
.Checkbox { border: 1px solid black; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) 'checkbox.less';
.Checkbox { border: 1px solid black; }
`);
    });

    it('with (once) imports on incremental build', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) 'input.less';
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) 'input.less';
@import (once) 'button.less';
.Button { font-weight: bold; }
`);
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) 'input.less';
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) 'input.less';
@import (once) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with duplicate (css) imports', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (css) 'button.less';
@import (css) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (css) 'button.less';
@import (css) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with duplicate (css,once) imports', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (css,once) 'button.less';
@import (css,once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (css,once) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with duplicate (once,css) imports', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once,css) 'button.less';
@import (once,css) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once,css) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with duplicate (css,reference) imports', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (css,reference) 'button.less';
@import (css,reference) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (css,reference) 'button.less';
@import (css,reference) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with duplicate (css,once,reference) imports', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (css,once,reference) 'button.less';
@import (css,once,reference) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (css,once,reference) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with duplicate (*,once,*) imports', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (css,once,reference) 'button.less';
@import (reference,css,once) 'button.less';
@import (once,reference,css) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (css,once,reference) 'button.less';
.Button { font-weight: bold; }
`);
    });

    it('with double quotes', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) "button.less";
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) "button.less";
.Button { font-weight: bold; }
`);
    });

    it('with url', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) url(button.less);
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) url(button.less);
.Button { font-weight: bold; }
`);
    });

    it('with url and single quotes', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) url('button.less');
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) url('button.less');
.Button { font-weight: bold; }
`);
    });

    it('with url and double quotes', () => {
        expect(
            lessImportOnce
                .call(
                    context,
                    Buffer.from(`
@import (once) url("button.less");
@import (once) 'button.less';
.Button { font-weight: bold; }
`)
                )
                ?.toString()
        ).toBe(`
@import (once) url("button.less");
.Button { font-weight: bold; }
`);
    });
});
