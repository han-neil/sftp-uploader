import chalk from 'chalk'
const slog:any = require('single-line-log').stdout

import { PointLog, ProgressBar, ProgressOpt } from './type.d'

/**
 * 打印日志
 * @param text 内容
 * @param type 类型
 */
const pointLog: PointLog = (text, type = 'info') => {
  let outputText: string = text

  switch (type) {
    case 'success':
      outputText = chalk.green(outputText)
    case 'error':
      outputText = chalk.red(outputText)
    case 'link':
      outputText = chalk.blue(outputText)
    case 'info':
      outputText = chalk.cyanBright(outputText)
    default:
      outputText = chalk.cyanBright(outputText)
  }

  console.log(outputText)
}

/**
 * 进度条
 * @param description 命令行开头的文字信息
 * @param bar_length 进度条的长度(单位：字符)，默认设为 25
 */
const progressBar:ProgressBar = (description = '进度', bar_length = 25) => {
  // 两个基本参数(属性)
  return (opts: ProgressOpt) => {
    let percent:any = (opts.completed / opts.total).toFixed(4) // 计算进度(子任务的 完成数 除以 总数)
    let cell_num = Math.floor(percent * bar_length) // 计算需要多少个 █ 符号来拼凑图案 // 拼接黑色条
    let cell = ''
    for (let i = 0; i < cell_num; i++) {
      cell += '█'
    } // 拼接灰色条
    let empty = ''
    for (let i = 0; i < bar_length - cell_num; i++) {
      empty += '░'
    } // 拼接最终文本
    let cmdText = `  - ${description}: ${cell}${empty} ${(
      100 * percent
    ).toFixed(2)}% (${opts.completed}/${opts.total})` // 在单行输出文本
    // slog(pointLog(cmdText))
    slog(cmdText)
  }
}

export { pointLog, progressBar }
