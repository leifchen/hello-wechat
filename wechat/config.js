'use strict'

const path = require('path')
const util = require('../libs/util')

const wechat_file = path.join(__dirname, '../config/wechat.txt')

// 声明对象字面量config 用于存储配置信息、读取写入票据的方法
const config = {
  wechat: {
    appID: 'wechat appID',
    appsecret: 'wechat appsecret',
    token: 'your token',
    getAccessToken: function () {
      return util.readFileAsync(wechat_file)
    },
    saveAccessToken: function (data) {
      data = JSON.stringify(data)
      return util.writeFileAsync(wechat_file, data)
    }
  }
}

module.exports = config