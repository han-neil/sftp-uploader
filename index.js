const fs = require('fs')
const glob = require('glob')
const Client = require('ssh2-sftp-client')
const sftp = new Client()
const pluginName = 'sftpUploader'
module.exports = class sftpUploader {
  constructor({
    dir = '',
    url = '',
    host = '',
    port = '',
    username = '',
    password = '',
    filterFile = null,
  } = {}) {
    // constructor是一个构造方法，用来接收参数
    this.url = url
    this.dir = dir
    this.filterFile = filterFile
    this.config = {
      host: host, // 服务器地址
      port: port,
      username: username,
      password: password,
    }
  }

  apply(compiler) {
    compiler.hooks.done.tap(pluginName, compilation => {
      if (!!process.env.UPLOAD) {
        this.put() // 开始上传逻辑
      }
    })
  }

  put() {
    // 自动上传到FTP服务器
    if (!this.dir) {
      console.error('无法上传SFTP,请检查参数')
      return
    }

    sftp
      .connect(this.config)
      .then(() => {
        // 连接服务器
        console.log('连接成功！')
        sftp
          .list(this.url)
          .then(list => {
            this.deleteServerFile(list).then(() => {
              this.globLocalFile()
            })
          })
          .catch(err => {
            this.exError(err)
          })
      })
      .catch(err => {
        this.exError('sftp连接失败' + err)
      })
  }

  async deleteServerFile(list) {
    // 删除服务器上文件(夹)
    console.log('开始删除原有文件')
    for (const fileInfo of list) {
      const path = this.url + fileInfo.name
      console.log('-: ' + path)
      if (fileInfo.type === '-') {
        await sftp.delete(path)
      } else {
        await sftp.rmdir(path, true)
      }
    }

    return new Promise(resovle => {
      resovle()
    })
  }

  globLocalFile() {
    // 获取本地路径所有文件
    glob(this.dir + '**', (er, files) => {
      // 本地目录下所有文件(夹)的路径
      files.splice(0, 1) // 删除路径../dist/
      if (this.filterFile && typeof this.filterFile === 'function')
        files = files.filter(x => this.filterFile(x))
      this.uploadFileToSftp(files)
    })
  }

  async uploadFileToSftp(files) {
    // 传输文件到服务器
    console.log('开始上传文件到目标文件夹')
    for (const localSrc of files) {
      const targetSrc = localSrc.replace(this.dir.replace(/\\/g, '/'), this.url)
      console.log('+: ' + targetSrc)
      if (fs.lstatSync(localSrc).isDirectory()) {
        // 是文件夹
        await sftp.mkdir(targetSrc)
      } else {
        await sftp.put(localSrc, targetSrc)
      }
    }
    console.log(`已上传${files.length}个文件至SFTP服务器`)
    sftp.end()
  }

  exError(err) {
    // 出错请调用此方法
    sftp.end()
    console.error('sftpError:', err)
  }
}
