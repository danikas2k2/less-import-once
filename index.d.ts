declare module "loader" {
    import type { RawLoaderDefinitionFunction } from 'webpack';
    interface LoaderContext {
        sharedImports?: Map<string, string>;
    }
    const WebpackLessImportOnce: RawLoaderDefinitionFunction<{}, LoaderContext>;
    export default WebpackLessImportOnce;
}
