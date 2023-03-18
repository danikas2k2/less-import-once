import { Buffer } from 'buffer';
import type { RawLoaderDefinitionFunction } from 'webpack';
import { WebpackError } from 'webpack';

const LOADER_NAME = 'less-import-once';
const CACHE_KEY = 'shared-imports';

const WebpackLessImportOnce: RawLoaderDefinitionFunction = function (content, map, meta) {
    const callback = this.async();
    (async () => {
        if (!this._compiler?.options?.cache) {
            // TODO add schema validation
            return callback?.(new WebpackError(`${LOADER_NAME} requires webpack cache to be enabled`));
        }

        const cache = this._compiler?.getCache(LOADER_NAME);
        if (!cache) {
            return callback?.(new WebpackError(`${LOADER_NAME} requires webpack cache to be enabled`));
        }

        let sharedImports = await cache.getPromise<Map<string, string>>(CACHE_KEY, null);
        if (!sharedImports) {
            sharedImports = new Map();
        }

        const { size } = sharedImports;
        const { resourcePath } = this;
        const localImports = new Set<string>();
        const result = content
            .toString()
            .replace(
                /[ \t]*@import\s*\(\s*(?:\w+\s*,\s*)*once(?:\s*,\s*\w+)*\s*\)\s*(?:url\(\s*'([^']+)'?\s*\)|url\(\s*"([^"]+)"?\s*\)|url\(\s*([^)]+)\s*\)|'([^']+)'|"([^"]+)")\s*;[ \t]*\n?/g,
                (
                    found,
                    pathUrlSingleQuotes,
                    pathUrlDoubleQuotes,
                    pathUrlNoQuotes,
                    pathSingleQuotes,
                    pathDoubleQuotes
                ) => {
                    const path =
                        pathUrlSingleQuotes ||
                        pathUrlDoubleQuotes ||
                        pathUrlNoQuotes ||
                        pathSingleQuotes ||
                        pathDoubleQuotes;

                    // prevent importing the same file twice in the same file
                    if (localImports.has(path)) {
                        return '';
                    }

                    // prevent importing the same file twice
                    const importedByResource = sharedImports.get(path);
                    if (importedByResource != null && importedByResource !== resourcePath) {
                        return '';
                    }

                    localImports.add(path);
                    sharedImports.set(path, resourcePath);

                    return found;
                }
            );

        if (size !== sharedImports.size) {
            await cache.storePromise(CACHE_KEY, null, sharedImports);
        }
        return callback(null, Buffer.from(result), map, meta);
    })();
};

export default WebpackLessImportOnce;
