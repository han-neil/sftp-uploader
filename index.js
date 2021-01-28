const fs = require('fs')
const glob = require('glob')
const Client = require('ssh2-sftp-client')
const sftp = new Client()
const pluginName = 'sftpUploader'
const slog = require('single-line-log').stdout
let isFirst = true
module.exports = class sftpUploader {
  constructor({
    dir = '',
    url = '',
    host = '',
    port = '',
    username = '',
    password = '',
    uploadFilter = null,
    deleteFilter = null,
    previewPath = '',
  } = {}) {
    // constructor是一个构造方法，用来接收参数
    this.url = url
    this.dir = dir
    this.deleteFilter = deleteFilter // 删除文件过滤
    this.uploadFilter = uploadFilter // 上传文件过滤
    this.previewPath = previewPath
    this.config = {
      host: host, // 服务器地址
      port: port,
      username: username,
      password: password,
    }
  }

  apply(compiler) {
    compiler.hooks.done.tap(pluginName, compilation => {
      if (!!process.env.UPLOAD && isFirst) {
        isFirst = false
        this.put() // 开始上传逻辑
      }
    })
  }

  put() {
    // 自动上传到FTP服务器
    if (!this.dir) {
      console.error('|无法上传SFTP,请检查参数')
      return
    }

    sftp
      .connect(this.config)
      .then(() => {
        // 连接服务器
        console.log('┌─────────────────────────────────────────────────────')
        console.log('│ 连接成功！')
        console.log('├─────────────────────────────────────────────────────')
        sftp
          .list(this.url)
          .then(files => {
            // 过滤掉不需要删除的文件
            if (this.deleteFilter && typeof this.deleteFilter === 'function') {
              files = files.filter(x => this.deleteFilter(x))
            }
            this.deleteServerFile(files).then(() => {
              this.globLocalFile()
            })
          })
          .catch(err => {
            this.exError(err)
          })
      })
      .catch(err => {
        this.exError('└ sftp连接失败' + err)
      })
  }

  async deleteServerFile(list) {
    // 删除服务器上文件(夹)
    const speed = new progressBar('├ 删除中') // 上传进度条
    const total = list.length
    let i = 0
    for (const fileInfo of list) {
      i++
      speed.render({ completed: i, total })
      const path = this.url + fileInfo.name
      if (fileInfo.type === '-') {
        await sftp.delete(path)
      } else {
        await sftp.rmdir(path, true)
      }
    }
    console.log(``)
    console.log(`├ 已删除${total}个文件`)

    return new Promise(resovle => {
      resovle()
    })
  }

  globLocalFile() {
    // 获取本地路径所有文件
    glob(this.dir + '**', (er, files) => {
      // 本地目录下所有文件(夹)的路径
      files.splice(0, 1) // 删除路径../dist/
      if (this.uploadFilter && typeof this.uploadFilter === 'function') {
        files = files.filter(x => this.uploadFilter(x))
      }
      this.uploadFileToSftp(files)
    })
  }

  async uploadFileToSftp(files) {
    // 传输文件到服务器
    const speed = new progressBar('├ 上传中') // 上传进度条
    const total = files.length
    let i = 0
    for (const localSrc of files) {
      i++
      const targetSrc = localSrc.replace(this.dir.replace(/\\/g, '/'), this.url)
      speed.render({ completed: i, total })
      if (fs.lstatSync(localSrc).isDirectory()) {
        // 是文件夹
        await sftp.mkdir(targetSrc)
      } else {
        await sftp.put(localSrc, targetSrc)
      }
    }
    console.log(``)
    console.log(`├ 已上传${files.length}个文件至SFTP服务器`)
    if (this.previewPath) {
      console.log(`├─────────────────────────────────────────────────────`)
      console.log(`├ 预览地址：${this.previewPath}`)
      console.log(`└─────────────────────────────────────────────────────`)
    } else {
      console.log(`└─────────────────────────────────────────────────────`)
    }
    sftp.end()
  }

  exError(err) {
    // 出错请调用此方法
    sftp.end()
    console.error('└sftpError:', err)
  }
}

// 进度条
function progressBar(description, bar_length) {
  // 两个基本参数(属性)
  this.description = description || '进度' // 命令行开头的文字信息
  this.length = bar_length || 25 // 进度条的长度(单位：字符)，默认设为 25 // 刷新进度条图案、文字的方法
  this.render = function (opts) {
    var percent = (opts.completed / opts.total).toFixed(4) // 计算进度(子任务的 完成数 除以 总数)
    var cell_num = Math.floor(percent * this.length) // 计算需要多少个 █ 符号来拼凑图案 // 拼接黑色条
    var cell = ''
    for (var i = 0; i < cell_num; i++) {
      cell += '█'
    } // 拼接灰色条
    var empty = ''
    for (var i = 0; i < this.length - cell_num; i++) {
      empty += '░'
    } // 拼接最终文本
    var cmdText =
      this.description +
      ': ' +
      (100 * percent).toFixed(2) +
      '% ' +
      cell +
      empty +
      ' ' +
      opts.completed +
      '/' +
      opts.total // 在单行输出文本
    slog(cmdText)
  }
}
