'use strict'

const Koa = require('koa')
const path = require('path')
const generator = require('./wechat/generator')
const util = require('./libs/util')
const config = require('./wechat/config')
const weixin = require('./weixin')

const wechat_file = path.join(__dirname, './config/wechat.txt')

// 实例化Koa的web服务器
var app = new Koa()
// 传入配置参数
app.use(generator(config.wechat, weixin.reply))
// 监听3000端口
app.listen(3000)
console.log('Listening on port 3000: ...')