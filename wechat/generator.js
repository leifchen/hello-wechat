'use strict'

const sha1 = require('sha1')
const getRawBody = require('raw-body')
const weChat = require('./wechat')
const tools = require('./tools')

// 建立中间件函数并暴露出去
module.exports = function (opts, handler) {
  var wechat = new weChat(opts)
  return function* (next) {
    var that = this
    var token = opts.token
    var signature = this.query.signature
    var nonce = this.query.nonce
    var timestamp = this.query.timestamp
    var echostr = this.query.echostr
    // 进行字典排序
    var str = [token, timestamp, nonce].sort().join('')
    // 加密
    var sha = sha1(str)

    if (this.method === 'GET') {
      // 如果是get请求 判断加密后的值是否等于签名值
      if (sha === signature) {
        this.body = echostr + ''
      } else {
        this.body = 'wrong'
      }
    } else if (this.method === 'POST') {
      // 如果是post请求 也是先判断签名是否合法 如果不合法 直接返回wrong
      if (sha !== signature) {
        this.body = 'wrong'
        return false
      }

      // 通过raw-body模块 可以把this上的request对象 也就是http模块中的request对象 去拼装它的数据 最终拿到一个buffer的xml数据
      // 通过yield关键字 获取到post过来的原始的XML数据
      var data = yield getRawBody(this.req, {
        length: this.length,
        limit: '1mb',
        encoding: this.charset
      })
      // 把XML数据转化成数组对象
      var content = yield tools.parseXMLAsync(data)
      // 格式化content数据为json对象
      var message = tools.formatMessage(content.xml)
      // 将message挂载到this.weixin上
      this.weixin = message
      // 使用yield next将控制权交出去 交给业务层 让业务层决定如何对解析后的微信消息做分析和回复
      yield handler.call(this, next)
      // 进行回复
      wechat.reply.call(this)
    }
  }
}