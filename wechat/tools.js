'use strict'

const xml2js = require('xml2js')
const Promise = require('bluebird')
const template = require('./template')

// 导出解析XML的方法
exports.parseXMLAsync = function (xml) {
  return new Promise(function (resolve, reject) {
    xml2js.parseString(xml, {
      trim: true
    }, function (err, content) {
      if (err) {
        reject(err)
      } else {
        resolve(content)
      }
    })
  })
}

// 因为value值可能是嵌套多层的 所以先对value值进行遍历
function formatMessage(result) {
  var message = {}

  if (typeof result === 'object') {
    var keys = Object.keys(result)
    for (let i = 0; i < keys.length; i++) {
      var item = result[keys[i]]
      var key = keys[i]

      if (!(item instanceof Array) || item.length === 0) {
        continue
      }

      if (item.length === 1) {
        var val = item[0]

        if (typeof val === 'object') {
          message[key] = formatMessage(val)
        } else {
          message[key] = (val || '').trim()
        }
      } else {
        message[key] = []

        for (let j = 0, k = item.length; j < k; j++) {
          message[key].push(formatMessage(item[j]))
        }
      }
    }
  }

  return message
}

exports.formatMessage = formatMessage

// 暴露消息模板工具
exports.template = function(content, message) {
  var info = {}
  var type = 'text'
  var fromUserName = message.FromUserName
  var toUserName = message.ToUserName

  if (Array.isArray(content)) {
    type = 'news'
  }

  // 当事件为拍照 选照片 地理位置时 服务器会返回两条返回内容 此时content的值为undefined
  if (!content) {
    content = 'Empty news'
  }

  type = content.type || type
  info.content = content
  info.createTime = new Date().getTime()
  info.msgType = type
  info.toUserName = fromUserName
  info.fromUserName = toUserName

  return template.compiled(info)
}