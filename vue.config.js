module.exports = {
  pages: {
    options: {
      template: 'public/browser-extension.html',
      entry: './src/options/options.js',
      title: 'Options',
    },
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js',
        },
        contentScripts: {
          entries: {
            'content-script': [
              'src/content-scripts/content-script.js',
            ],
          },
        },
      },
      // avoid error in development build
      manifestTransformer: (manifest) => {
        if (process.env.NODE_ENV === 'development') {
          manifest.content_scripts[0].css.pop();
        }
        return manifest;
      },
    },
  },
  filenameHashing: false,
  productionSourceMap: false,
  configureWebpack: {
    devtool: 'source-map',
  },
};
