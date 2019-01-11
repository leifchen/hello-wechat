'use strict'

// 引入外部文件
var config = require('./wechat/config')
var weChat = require('./wechat/wechat')
var menu = require('./menu')
// 初始化weChat 并传入配置信息
var wechatApi = new weChat(config.wechat)
// 重置并初始化菜单
wechatApi.delMenu()
  .then(function () {
    return wechatApi.createMenu(menu)
  })
  .then(function (msg) {
    console.log(msg)
  })

// 向外暴露reply接口 这里使用了生成器函数
exports.reply = function* (next) {
  var message = this.weixin

  // 判断用户行为 是事件推送还是普通消息 先判断的是事件推送
  if (message.MsgType === 'event') {
    // 订阅事件 分为搜索订阅和二维码订阅
    if (message.Event === 'subscribe') {
      if (message.EventKey) {
        console.log('扫描二维码进来:' + message.EventKey + ' ' + message.Ticket)
      }
      this.body = '欢迎订阅我的公众号'
    }
    // 取消订阅事件
    else if (message.Event === 'unsubscribe') {
      console.log('用户取消了关注')
      this.body = ''
    }
    // 地理位置事件
    else if (message.Event === 'LOCATION') {
      this.body = '您上报的位置是:' + message.Latitude + '/' + message.Longitude + '-' + message.Precision
    }
    // 点击事件 自定义菜单事件
    else if (message.Event === 'CLICK') {
      this.body = '您点击了菜单:' + message.EventKey
    }
    // 跳转链接事件 点击菜单跳转链接时的事件推送
    else if (message.Event === 'VIEW') {
      this.body = '您点击了菜单中的链接：' + message.EventKey
    }
    // 扫描事件
    else if (message.Event === 'SCAN') {
      console.log('关注后扫描二维码' + message.EventKey + ' ' + message.Ticket)
      this.body = '看到你扫一下哦'
    }
    // 扫码推送
    else if (message.Event === 'scancode_waitmsg') {
      console.log(message.ScanCodeInfo.ScanType);
      console.log(message.ScanCodeInfo.ScanResult);
      this.body = '您点击了菜单中的：' + message.EventKey;
    }
    // 弹出系统拍照
    else if (message.Event === 'pic_sysphoto') {
      console.log(message.SendPicsInfo.PicList);
      console.log(message.SendPicsInfo.Count);
      this.body = '您点击了菜单中的：' + message.EventKey;
    }
    // 弹出拍照或者相册
    else if (message.Event === 'pic_photo_or_album') {
      console.log(message.SendPicsInfo.PicList);
      console.log(message.SendPicsInfo.Count);
      this.body = '您点击了菜单中的：' + message.EventKey;
    }
    // 微信相册发图
    else if (message.Event === 'pic_weixin') {
      console.log(message.SendPicsInfo.PicList);
      console.log(message.SendPicsInfo.Count);
      this.body = '您点击了菜单中的：' + message.EventKey;
    }
    // 地理位置选择器
    else if (message.Event === 'location_select') {
      console.log(message.SendLocationInfo.Location_X);
      console.log(message.SendLocationInfo.Location_Y);
      console.log(message.SendLocationInfo.Scale);
      console.log(message.SendLocationInfo.Label);
      console.log(message.SendLocationInfo.Poiname);
      this.body = '您点击了菜单中的：' + message.EventKey;
    }
  }
  // 普通消息 文本消息
  else if (message.MsgType === 'text') {
    var content = message.Content
    // 除了回复策略里的内容就回复这句
    var reply = '对不起，你说的' + message.Content + '太复杂了，我理解不了'
    // 回复策略--文本
    if (content === '1') {
      reply = '我是回复策略中的第一条'
    } else if (content === '2') {
      reply = '我是回复策略中的第二条'
    } else if (content === '3') {
      reply = '我是回复策略中的第三条'
    }
    // 回复策略--图文
    else if (content === '4') {
      reply = [{
        title: '慕课网',
        description: '学习IT知识好网站',
        picUrl: 'https://mmbiz.qpic.cn/mmbiz_jpg/VsJUKtozTYOibVrTBM0YAeNRAicOH6sG5rdR9ZicicYqtibGgB1va9ibC2PBZIcp2m6khQOJYb7QXIgeiaeQH2WG9EzRw/0?wx_fmt=jpeg',
        url: 'https://www.imooc.com/'
      }]
    }
    // 回复策略--新增临时素材测试
    else if (content === '5') {
      var data = yield wechatApi.uploadMaterial('image', __dirname + '/images/lulu.jpg')
      reply = {
        type: 'image',
        mediaId: data.media_id
      }
    }
    // 回复策略--新增临时素材测试--视频素材
    else if (content === '6') {
      var data = yield wechatApi.uploadMaterial('video', __dirname + '/materials/test.mp4')
      reply = {
        type: 'video',
        title: '测试视频',
        description: '打篮球',
        mediaId: data.media_id
      }
    }
    // 回复策略--新增临时素材测试--音频素材
    else if (content === '7') {
      var data = yield wechatApi.uploadMaterial('image', __dirname + '/images/music.png')
      reply = {
        type: 'music',
        title: '有可能的夜晚',
        description: '微微一笑很倾城插曲',
        musicUrl: 'https://pan.baidu.com/s/1nNws4xN1PfYXzvAKCVr2Xw',
        thumbMediaId: data.media_id
      }
    }
    // 回复策略--新增永久素材测试--图片素材
    else if (content === '8') {
      var data = yield wechatApi.uploadMaterial('image', __dirname + '/images/lulu.jpg', {
        type: 'image'
      })
      console.log(data)
      reply = {
        type: 'image',
        mediaId: data.media_id
      }
    }
    // 回复策略--新增永久素材测试--视频素材
    else if (content === '9') {
      var data = yield wechatApi.uploadMaterial('vedio', __dirname + '/materials/test.mp4', {
        type: 'video',
        description: '{"title":"test title","introduction":"test introduction"}'
      })
      console.log(data)
      reply = {
        type: 'vedio',
        title: '测试视频',
        description: '打篮球',
        mediaId: data.media_id
      }
    }
    // 回复策略--获取永久素材
    else if (content === '11') {
      // 获取素材总数
      var counts = yield wechatApi.countMaterial()
      console.log(JSON.stringify(counts))

      // 获取素材列表
      var results = yield [
        wechatApi.batchMaterial({
          type: 'image',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'voice',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'video',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'news',
          offset: 0,
          count: 10
        }),
      ]
      console.log(JSON.stringify(results))
      reply = '获取素材列表成功'
    }
    // 回复策略--用户标签操作
    else if (content === '12') {
      // 创建用户标签
      var group1 = yield wechatApi.createTag('Development')
      var group2 = yield wechatApi.createTag('Operations')

      // 获取用户标签
      var fetchTag1 = yield wechatApi.fetchTag()
      console.log(JSON.stringify(fetchTag1))

      // 编辑用户标签
      var updateTag1 = yield wechatApi.updateTag(104, 'Dev')
      console.log(JSON.stringify(updateTag1))

      var fetchTag2 = yield wechatApi.fetchTag()
      console.log(JSON.stringify(fetchTag2))

      // 删除用户标签
      var delTag1 = yield wechatApi.delTag(105)

      // 获取用户标签
      var fetchTag3 = yield wechatApi.fetchTag()
      console.log(JSON.stringify(fetchTag3))

      reply = '用户标签操作成功！'
    }
    // 回复策略--用户信息获取
    else if (content === '13') {
      // 单个获取用户信息
      var user = yield wechatApi.fetchUsers(message.FromUserName, 'en')
      console.log(user)

      // 批量获取用户信息
      var openIds = [{
        openid: message.FromUserName,
        lang: 'en'
      }]
      var users = yield wechatApi.fetchUsers(openIds)
      console.log(users)

      reply = '用户信息获取成功'
    }
    // 回复策略--获取用户列表
    else if (content === '14') {
      // 获取用户列表
      var userList = yield wechatApi.listUsers()
      console.log(userList)

      reply = userList.total
    }
    // 回复策略--根据标签群发消息
    else if (content === '15') {
      var image = {
        media_id: 'qL1-cWaXnEg_wwKRigz5BjalqoivxHRdHJTdr_oyV08'
      }
      var msgData = yield wechatApi.sendByTag('image', image)
      console.log(msgData)
      reply = '群发消息成功'
    }

    // 将回复reply交给body
    this.body = reply
  }
  yield next
}