import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Dotenv from 'dotenv-webpack';

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
      filename: 'bundle.js', // Output bundle name
      path: resolve(__dirname, './dist'), // Output path in the backend folder
      publicPath: '/', // Important for handling routing in React with client-side routing
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
          },
        },
      ],
    },

    // Plugins for additional functionalities
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html', // Template for the HTML file
        filename: 'index.html', // Name of the output HTML file in the build folder
      }),
      new Dotenv({
        path: isProduction ? './.env.production' : './.env.development',
      }),
    ],

    // File extensions to resolve
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
    },
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
  };
};
