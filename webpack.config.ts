import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import DuplicatedCheckerPlugin from 'duplicate-package-checker-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';

module.exports = (env: { production: boolean }) => ({
  name: 'client',
  mode: env.production ? 'production' : 'development',
  devtool: env.production ? 'source-map' : 'eval',
  devServer: { static: './build' },
  target: 'web',
  entry: './client',
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: path.join(__dirname, 'build'),
    publicPath: '/',
    clean: true,
  },
  resolve: { extensions: ['.tsx', '.ts', '.js', '.json'] },
  optimization: {
    emitOnErrors: false,
    moduleIds: 'deterministic',
    minimize: true,
    minimizer: env.production
      ? [
          new TerserPlugin({
            extractComments: true,
            parallel: true,
            terserOptions: {
              mangle: true,
              ecma: 2017,
              safari10: true,
              compress: { hoist_funs: true, passes: 2 },
            },
          }),
          new CssMinimizerPlugin(),
        ]
      : [],
  },
  stats: { colors: true },
  performance: { hints: env.production ? 'warning' : false },
  module: {
    rules: [
      {
        test: /\.css$/i,
        include: [
          path.join(__dirname, 'style.css'),
          path.join(__dirname, 'node_modules'),
        ],
        use: [
          { loader: MiniCssExtractPlugin.loader, options: { esModule: true } },
          {
            loader: 'css-loader',
            options: { sourceMap: false, importLoaders: 1 },
          },
        ],
      },
      {
        test: /\.tsx?$/i,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader', options: { cacheDirectory: true } },
          {
            loader: '@linaria/webpack-loader',
            options: {
              sourceMap: false,
              cacheDirectory: path.join(
                __dirname,
                'node_modules/.cache/linaria'
              ),
            },
          },
        ],
      },
      {
        test: /\.png/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: (env.production ? [] : [new DuplicatedCheckerPlugin()]).concat(
    new MiniCssExtractPlugin({
      filename: env.production ? '[name].[contenthash:8].css' : '[name].css',
      chunkFilename: env.production ? '[id].[contenthash:8].css' : '[id].css',
      ignoreOrder: true,
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      templateContent: '<html><body><div id="root"></div></body></html>',
    })
  ),
});
