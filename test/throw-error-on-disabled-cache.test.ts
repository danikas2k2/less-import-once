import path from 'path';
import type { WebpackOptionsValidationError } from 'webpack';
import { compile } from './utils/compile';
import { DIR } from './utils/ufs';

const entry = path.resolve(DIR, 'test.less');

it('throw error on disabled cache', async () => {
    expect.assertions(1);
    try {
        await compile({ entry }, {}, { cache: false });
    } catch (e: WebpackOptionsValidationError | WebpackOptionsValidationError[]) {
        expect((e.length ? e[0] : e).message).toContain('requires webpack cache to be enabled');
    }
});
