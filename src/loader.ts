import type { RawLoaderDefinitionFunction } from 'webpack';

interface LoaderContext {
    data: {
        sharedImports?: Map<string, string>;
    };
}

const WebpackLessImportOnce: RawLoaderDefinitionFunction<{}, LoaderContext> = function (
    content: string | Buffer
): Buffer {
    if (!this.data.sharedImports) {
        this.data.sharedImports = new Map<string, string>();
    }

    const {
        resourcePath,
        data: { sharedImports },
    } = this;
    const localImports = new Set<string>();

    return Buffer.from(
        content
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
            )
    );
};

export default WebpackLessImportOnce;
