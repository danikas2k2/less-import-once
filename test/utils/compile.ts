import type { Configuration } from 'webpack';
import compiler from './compiler';
import { ufs } from './ufs';

export async function compile(
    config: Configuration = {},
    loaderOptions = {},
    webpackOptions = {},
    incremental = false
): Promise<string[]> {
    const stats = await compiler(config, loaderOptions, webpackOptions, incremental, ufs);
    const json = stats?.toJson({ source: true });
    return json?.modules?.filter((m) => m?.name?.endsWith('.less')).map((m) => m!.source!.toString()) ?? [];
}
