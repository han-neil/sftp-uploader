<!--
 * @Descripttion:
 * @version:
 * @Author: 韩应波
 * @Date: 2020-12-03 15:23:31
 * @LastEditors: 韩应波
 * @LastEditTime: 2021-01-28 10:01:12
-->

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
          // 上传文件过滤器，可以过滤掉不需要的文件，返回false将不会上传该文件（可选）
          uploadFilter(file) => {
            return file.name.endsWith(.gz) ? true : false
          },
          // 删除文件过滤器，可以过滤掉不需要删除的文件，返回false将不会上传该文件（可选）
          deleteFilter(file) => {
            return file.name.endsWith(.gz) ? true : false
          },
          // 预览链接接地址（可选）
          previewPath: 'https://www.baidu.com'
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
