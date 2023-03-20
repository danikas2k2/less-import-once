import fs from 'fs';
import { Volume } from 'memfs';
import { Union } from 'unionfs';

export const DIR = './test';

const vol = new Volume();
vol.fromJSON(
    {
        'test.less': '',
        'test2.less': '',
        'test3.less': '',
    },
    DIR
);

export const ufs = new Union();
ufs.use(fs);
ufs.use(vol as any);
