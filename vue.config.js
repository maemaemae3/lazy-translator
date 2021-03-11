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
    },
  },
};
