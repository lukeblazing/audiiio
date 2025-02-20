import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import TerserPlugin from 'terser-webpack-plugin';

// Create __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    // Entry point for your app
    entry: './src/index.js',

    // Output configuration
    output: {
      filename: '[name].[contenthash].js', // Uses unique hashed filenames
      path: resolve(__dirname, './dist'),
      publicPath: '/',
    },

    // Module rules (Loaders)
    module: {
      rules: [
        {
          test: /\.jsx?$/, // For both .js and .jsx files
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader', // Use Babel to transpile ES6+ and JSX
          },
          resolve: {
            fullySpecified: false, // Allows importing without specifying extensions
          }
        },
        {
          test: /\.css$/, // For CSS files
          use: ['style-loader', 'css-loader'], // Use both style-loader and css-loader
        },
      ],
    },

    // Plugins for additional functionalities
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html', // ✅ Webpack injects correct script tags
        filename: 'index.html',
        inject: 'body', // ✅ Ensures scripts are added inside <body>
      }),
      new Dotenv({
        path: isProduction ? './.env.production' : './.env.development',
      }),
    ],

    optimization: {
      usedExports: true, // Enables tree shaking
      minimize: isProduction, // Minifies the bundle
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true, // Removes console logs in production
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all', // ✅ Splits vendor files (like lodash, dayjs, etc.)
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },

    // File extensions to resolve
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
    },
    devtool: isProduction ? 'hidden-source-map' : 'cheap-module-source-map',
  };
};
