# sftpupload

### 引入

```
yarn add sftp-uploader
npm i sftp-uploader

```

### 配置

```javascript
// vue.config.js
const sftpUploader = require('sftp-uploader')
module.exports = {
  configureWebpack: config => {
    return {
      plugins: [
        new sftpUploader({
          // 需要上传文件的目录
          dir: path.join(__dirname, 'dist/'),
          // 上传到的目录
          url: '******',
          // sftp地址
          host: '*****',
          // sftp端口
          port: '*****',
          // 账号
          username: '*****',
          // 密码
          password: '*****',
          // 文件过滤器，可以过滤掉不需要的文件，返回false将不会上传该文件（可选）
          filterFile(path) => {
            return path.endsWith(.gz) ? true : false
          }
        })
      ]
    }
  }
}

// package.json
"scripts": {
  "build": "vue-cli-service build --mode development",
  "deploy": "set UPLOAD=true && yarn build"
}

// 打包并上传
yarn deploy
```

### 使用

```
// 打包并上传
yarn deploy
```
