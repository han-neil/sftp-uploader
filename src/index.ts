const fs = require('fs')
const glob = require('glob')
const Client = require('ssh2-sftp-client')
const { pointLog, progressBar,  } = require('./util')
import { SftpUploaderParm, ConnectConfig } from './type.d'
import type { Plugin } from 'vite'


function sftpUploader(options: SftpUploaderParm): Plugin {
  const sftp = new Client()
  let trim:any = null,
    isFirst:boolean = true, // 防止多次调用
    timer: number = 0

  let url = options.url
  if (!url.endsWith('/')) {
    url = url + '/' // 如果上传目录没有以 / 结尾，自动加上，否则找不到文件
  }

  let config: ConnectConfig = {
    host: options.host, // 服务器地址
    port: options.port,
    username: options.username,
    password: options.password
  }

  // webpack钩子
  function apply (compiler:any): string {
    if(compiler && compiler.hooks && compiler.hooks.done) {
      compiler.hooks.done.tap('sftp-uploader', () => {
        isPut()
      })
    }
    return 'build'
  }

  // 判断环境，查看是否可以上传
  function isPut () {
    const ARGV_DEPLOY = process.argv.some(_ => _.includes('deploy')) || false // 从命令中获取deploy
    // 低版本npm不支持
    // const IS_DEPLOY = process.env.npm_config_argv?.includes('deploy') || false // 读取命令判断
    
    const UPLOAD = !!process.env.UPLOAD // 手动设置UPLOAD
    if (ARGV_DEPLOY || UPLOAD) {
      clearTimeout(trim)
      trim = setTimeout(() => {
        isFirst && put() // 开始上传逻辑
      }, options.delay || 0)
    }
  }

  function put () {
    isFirst = false
    // 自动上传到FTP服务器
    if (!options.dir) {
      pointLog('> 无法上传SFTP,请检查参数', 'error')
      return
    }

    timer = Date.now()

    pointLog('\n$sftp-uploader')

    sftp
      .connect(config)
      .then(() => {
        // 连接服务器
        pointLog('\n> 连接成功', 'success')
        pullDir()
      })
      .catch((err: string) => {
        exError('> sftp连接失败' + err)
      })
  }

  function pullDir () {
    sftp
      .list(options.url)
      .then((files: any[]) => {
        // 过滤掉不需要删除的文件
        if (options.deleteFilter && typeof options.deleteFilter === 'function') {
          files = files.filter((x: any) => options.deleteFilter(x))
        }
        deleteServerFile(files).then(() => {
          globLocalFile()
        })
      })
      .catch(() => {
        pointLog('  - 找不到文件夹：' + options.url + '，尝试创建文件夹')
        sftp
          .mkdir(options.url, true)
          .then((res: any) => {
            pointLog(`  - ${options.url}文件夹创建成功`)
            pullDir()
          })
          .catch((_: string) => {
            exError('  - 文件夹创建失败 ' + _)
          })
      })
  }

  async function deleteServerFile (list: any[]) {
    const total = list.length
    if (total > 0) {
      // 删除服务器上文件(夹)
      const speed = progressBar('删除中') // 上传进度条
      let i = 0
      for (const fileInfo of list) {
        i++
        speed({ completed: i, total })
        const path = options.url + fileInfo.name
        if (fileInfo.type === '-') {
          await sftp.delete(path)
        } else {
          await sftp.rmdir(path, true)
        }
      }
      pointLog(`\n  - 已删除${total}个文件或目录`, 'success')
    }

    return new Promise<void>(resovle => {
      resovle()
    })
  }

  function globLocalFile () {
    // 获取本地路径所有文件
    glob(options.dir + '**', (er: any, files: string[]) => {
      // 本地目录下所有文件(夹)的路径
      files.splice(0, 1) // 删除路径../dist/
      if (options.uploadFilter && typeof options.uploadFilter === 'function') {
        files = files.filter((x: any) => options.uploadFilter(x))
      }
      uploadFileToSftp(files)
    })
  }

  async function uploadFileToSftp (files: string[]) {
    // 传输文件到服务器
    const speed = progressBar('上传中') // 上传进度条
    const total:number = files.length
    let i = 0
    for (const localSrc of files) {
      i++
      const targetSrc = localSrc.replace(options.dir.replace(/\\/g, '/'), options.url)
      speed({ completed: i, total })
      if (fs.lstatSync(localSrc).isDirectory()) {
        // 是文件夹
        await sftp.mkdir(targetSrc)
      } else {
        await sftp.put(localSrc, targetSrc)
      }
    }
    pointLog(`\n  - 已上传${files.length}个文件`, 'success')
    pointLog(`  - 耗时: ${Date.now() - timer}ms`)
    if (options.previewPath) {
      pointLog(`  - 预览地址: ${options.previewPath} \n\n`, 'link')
    }
    sftp.end()
  }

  function exError (err: string) {
    sftp.end()
    pointLog(`  - sftpError:${err}`, 'error')
  }

  return {
    name: 'sftp-uploader',
    // @ts-ignore 因为要兼容webpack，所以会导致vite校验不通过
    apply, // webpack钩子
    put,
    // vite上传钩子
    closeBundle() {
      isPut()
    }
  }
}

export default sftpUploader
module.exports = sftpUploader