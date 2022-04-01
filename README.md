# sftp-uploader

> `sftp-uploader` 是一款基于 `ssh2-sftp-client` 封装的文件上传插件，支持 `webpack` 及 `vite` ，可以实现将打包好的项目文件一键上传到指定的sftp服务器目录，支持集成为`webpack`或`vite`插件或`单独`使用，支持自动创建上传目录。

## Install
![NPM](https://nodei.co/npm/sftp-uploader.png)
```sh
$ yarn add sftp-uploader
$ npm i sftp-uploader
```
## 配置

```javascript
const path = require('path')
const SftpUploader = require('sftp-uploader')

const sftp = SftpUploader({
  dir: path.join(__dirname, 'dist/'), // 需要上传文件的目录
  url: '******', // 上传到的目录
  host: '*****', // sftp地址
  port: '*****', // sftp端口
  username: '*****', // 账号
  password: '*****', // 密码
  // 延迟上传时间（毫秒），解决部分项目会触发多次打包完成的问题
  delay: 0,
  // 上传文件过滤器，可以过滤掉不需要的文件，返回false将不会上传该文件（可选）
  uploadFilter(file) => file.name.endsWith(.gz),
  // 删除文件过滤器，可以过滤掉不需要删除的文件，返回false将不会删除该文件（可选）
  deleteFilter(file) => file.name.endsWith(.gz),
  // 预览链接接地址（可选）
  previewPath: 'https://www.baidu.com'
})
```

# 使用
## 配合打包命令使用
```javascript
// webpack中使用
//vue.config.js
module.exports = {
  configureWebpack: config => {
    return {
      plugins: [
        SftpUploader({ ... })
      ]
    }
  }
}

// vite中使用
//vite.config.js
export default defineConfig({
  plugins: [
    SftpUploader({ ... })
  ]
})

// package.json
// 1、window环境
"scripts": {
  "build": "vue-cli-service build --mode development",
  "deploy": "set UPLOAD=true && yarn build"
}
// 2、liunx or macos环境
"scripts": {
  "build": "vue-cli-service build --mode development",
  "deploy": "export UPLOAD=true && yarn build"
}
// 使用 yarn deploy 或 npm run deploy
```

## 上传任意项目
```javascript
// 1、在项目中创建uploader.js
// 2、配置和webpack插件模式相同
SftpUploader({ ... }).put()
// 然后在项目根目录终端下运行如下命令
node uploader.js 
```

