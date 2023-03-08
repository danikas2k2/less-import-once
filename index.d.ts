declare module "loader" {
    import type { RawLoaderDefinitionFunction } from 'webpack';
    interface LoaderContext {
        data: {
            sharedImports?: Map<string, string>;
        };
    }
    const WebpackLessImportOnce: RawLoaderDefinitionFunction<{}, LoaderContext>;
    export default WebpackLessImportOnce;
}
