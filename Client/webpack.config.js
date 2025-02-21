import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import TerserPlugin from 'terser-webpack-plugin';
import fs from 'fs';

// Create __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.js',

    output: {
      filename: '[name].[contenthash].js',
      path: resolve(__dirname, './dist'),
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
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap("CopyPublicFiles", () => {
            const publicSource = resolve(__dirname, "public");
            const serviceWorkerSource = resolve(__dirname, "src/service-worker.js");
            const destination = resolve(__dirname, "dist");
      
            try {
              // Copy the entire public folder
              fs.cpSync(publicSource, destination, { recursive: true });
              console.log("✔ Public files copied to /dist");
      
              // Copy service-worker.js separately
              fs.copyFileSync(serviceWorkerSource, resolve(destination, "service-worker.js"));
              console.log("✔ service-worker.js copied to /dist");
            } catch (error) {
              console.error("❌ Failed to copy files:", error);
            }
          });
        },
      },
    ],

    optimization: {
      usedExports: true,
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
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
      static: [
        {
          directory: resolve(__dirname, "public"), // Serve files from public/
          publicPath: "/",
        },
        {
          directory: resolve(__dirname, "src"), // Serve files from src/ (for service-worker.js)
          publicPath: "/", 
        }
      ],
      compress: true,
      port: 8080,
      historyApiFallback: true,
    },    
  };
};
