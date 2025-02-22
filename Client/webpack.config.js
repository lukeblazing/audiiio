import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import TerserPlugin from 'terser-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path'; // Fixed incorrect import

// Create __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.js',

    output: {
      filename: '[name].[contenthash].js',
      path: resolve(__dirname, 'dist'),
      publicPath: '/',
    },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
          resolve: {
            fullySpecified: false, // Allows importing without specifying extensions
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        inject: 'body',
      }),
      new Dotenv({
        path: isProduction ? './.env.production' : './.env.development',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: path.resolve(__dirname, 'public'), 
            to: path.resolve(__dirname, 'dist'), 
            globOptions: { ignore: ['**/index.html'] } // Exclude index.html
          },
          { from: path.resolve(__dirname, 'src/service-worker.js'), to: path.resolve(__dirname, 'dist/service-worker.js') },
        ],
      }),      
    ],

    optimization: {
      usedExports: true,
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false,
              drop_debugger: false
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },

    resolve: {
      extensions: ['.js', '.jsx', '.json'],
    },
    devtool: isProduction ? 'hidden-source-map' : 'cheap-module-source-map',
    devServer: {
      static: {
        directory: resolve(__dirname, 'public'), // Serve only the public directory
        publicPath: '/',
      },
      compress: true,
      port: 8080,
      historyApiFallback: true,
    },    
  };
};
