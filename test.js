/*
 * @Descripttion:
 * @version:
 * @Author: 韩应波
 * @Date: 2021-01-28 09:28:35
 * @LastEditors: 韩应波
 * @LastEditTime: 2021-01-28 10:04:31
 */
const path = require('path')
const sftpUploader = require('./index')

const test = new sftpUploader({
  dir: path.join(__dirname, 'dist/'),
  host: '11111111',
  url: '/upload/',
  port: '88888',
  username: '123',
  password: '12345',
  previewPath: 'https://www.baidu.com',
  deleteFilter(path) {
    return !path.name.endsWith('package.json')
  },
})

test.put()
