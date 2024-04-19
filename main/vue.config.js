const path = require("path");
module.exports = {
  runtimeCompiler: true,
  productionSourceMap: true,
  chainWebpack: config => {
    config.plugin('html')
      .tap(args => {
        return args
      })
  },
};
