'use strict';

const { NODE_ENV } = process.env;
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const staticDir = path.resolve(__dirname, 'static');
const isProduction = NODE_ENV === 'production';
const watchOptions = {
    ignored: [staticDir, path.resolve(__dirname, 'node_modules')],
};

/**
 * Warning! Please don't even breathe near this config.
 *
 * Jokes aside, here's what you need to do in case you feel adventurous enough
 * to actually tweak stuff.
 *
 * - Make sure _most_ of the `node_modules` are not bundled. A good heuristic is a sheer size
 *   of `app.js`, but also you can always open it and search for some familiar code which you
 *   think shouldn't be there (e.g. `Browser` from `@automationcloud/engine`)
 * - Make sure Vue is bundled and aliased to `vue.esm.js`. You'll notice a violation of this
 *   if app goes blank and console says "You included runtime version of Vue,
 *   make sure you include template compiler as well".
 * - Make sure Vue hot reloading works (e.g. by modifying some Vue file, saving it and observing
 *   the change without reloading)
 * - Make sure Node.js globals are not polyfilled (e.g. by inspecting `process` variable via DevTools)
 * - Finally, always check that build scripts produces a workable application,
 *   especially if you use `npm link @automationcloud/engine` in development.
 */
module.exports = {
    // target: 'electron-renderer',
    mode: isProduction ? 'production' : 'development',
    devtool: 'source-map',
    entry: {
        app: './src/app/entrypoint.ts',
    },
    output: {
        path: path.resolve(staticDir, 'build'),
        filename: '[name].js',
        publicPath: isProduction ? 'build/' : 'http://localhost:9000/',
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    configFile: 'tsconfig.app.json',
                },
            },
            {
                test: /\.svg$/,
                loader: 'file-loader',
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    {
                        loader: 'css-loader',
                        options: { importLoaders: 1 }
                    },
                    'postcss-loader'
                ],
            },
        ],
    },
    externals: [
        function(context, request, callback) {
            // Only bundle vue and webpack dev server modules
            const whitelist = ['vue', 'sockjs-client/dist/sockjs', 'webpack/hot/emitter'];
            if (whitelist.includes(request)) {
                return callback();
            }
            // All non-relative paths are not bundled
            if (/^[@a-zA-Z]/.test(request)) {
                return callback(null, `commonjs ${request}`);
            }
            // Bundle relative paths
            return callback();
        },
    ],
    resolve: {
        alias: {
            vue$: 'vue/dist/vue.esm.js',
            '~': path.join(__dirname, 'src/app'),
        },
        extensions: ['*', '.js', '.vue', '.json', '.ts'],
    },
    node: false,
    devServer: {
        port: 9000,
        hotOnly: true,
        disableHostCheck: true,
        contentBase: staticDir,
        stats: 'minimal',
        watchOptions,
    },
    watchOptions,
    plugins: [
        new VueLoaderPlugin(),
    ],
    optimization: {
        minimize: false,
    },
};
