const path = require('path');

function resolve (dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  publicPath: './',
  devServer: {
    // can be overwritten by process.env.HOST
    host: '0.0.0.0',  
    port: 8080
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src'))
      .set('src', resolve('src'))
      .set('common', resolve('src/common'))
      .set('components', resolve('src/components'));
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      win: {
        icon: './public/app.ico',
        target: [
          {
            target: 'nsis',
            arch: []
          }
        ]
      },
      nsis: {
        "oneClick": false,
        "perMachine": true,
        "allowElevation": true,
        "allowToChangeInstallationDirectory": true,
        "createDesktopShortcut": true,
        "createStartMenuShortcut": true
      },
      productName: 'WebSocket测试工具'
    }
  }
};