'use strict'

const Promise = require('bluebird')
const request = Promise.promisify(require('request'))
const fs = require('fs')
const tools = require('./tools')
const _ = require('lodash')

const prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
  accessToken: prefix + 'token?grant_type=client_credential',
  // 临时素材
  temporary: {
    upload: prefix + 'media/upload?',
    fetch: prefix + 'media/get?'
  },
  // 永久素材
  permanent: {
    upload: prefix + 'material/add_material?',
    uploadNews: prefix + 'material/add_news?',
    uploadNewsPic: prefix + 'media/uploadimg?',
    fetch: prefix + 'material/get_material?',
    del: prefix + 'material/del_material?',
    update: prefix + 'material/update_news?',
    count: prefix + 'material/get_materialcount?',
    batch: prefix + 'material/batchget_material?'
  },
  // 标签
  tag: {
    create: prefix + 'tags/create?',
    fetch: prefix + 'tags/get?',
    update: prefix + 'tags/update?',
    del: prefix + 'tags/delete?'
  },
  // 用户管理
  user: {
    remark: prefix + 'user/info/updateremark?',
    fetch: prefix + 'user/info?',
    batchFetch: prefix + 'user/info/batchget?',
    list: prefix + 'user/get?'
  },
  // 群发消息
  mass: {
    tag: prefix + 'message/mass/sendall?',
    openId: prefix + 'message/mass/send?',
    del: prefix + 'message/mass/delete?',
    preview: prefix + 'message/mass/preview?',
    check: prefix + 'message/mass/get?'
  },
  // 自定义菜单
  menu: {
    create: prefix + 'menu/create?',
    fetch: prefix + 'menu/get?',
    del: prefix + 'menu/delete?',
    current: prefix + 'get_current_selfmenu_info?'
  }
}

// 利用构造函数生成实例 完成票据存储逻辑
function weChat(opts) {
  this.appID = opts.appID
  this.appsecret = opts.appsecret
  this.getAccessToken = opts.getAccessToken
  this.saveAccessToken = opts.saveAccessToken
  this.fetchAccessToken()
}

// 在weChat的原型链上增加fecthAccessToken方法 让获取票据的方法作为接口独立出来
weChat.prototype.fetchAccessToken = function (data) {
  var that = this
  // 先对access_token进行判断 如果this.access_token && this.expires_in存在且在有效期内
  if (this.access_token && this.expires_in) {
    if (this.isValidAccessToken(this)) {
      return Promise.resolve(this)
    }
  }
  // 获取票据的方法
  return this.getAccessToken()
    .then(function (data) {
      // 从静态文件获取票据，JSON化数据，如果有异常，则尝试更新票据
      try {
        data = JSON.parse(data)
      } catch (e) {
        return that.updateAccessToken()
      }

      // 判断票据是否在有效期内，如果合法，向下传递票据，如果不合法，更新票据
      if (that.isValidAccessToken(data)) {
        return Promise.resolve(data)
      } else {
        return that.updateAccessToken()
      }
    })
    // 将拿到的票据信息和有效期信息存储起来
    .then(function (data) {
      // 第二次访问无法获取到data
      that.access_token = data.access_token
      that.expires_in = data.expires_in

      that.saveAccessToken(data)
      return Promise.resolve(data)
    })
}

// 在weChat的原型链上增加验证有效期的方法
weChat.prototype.isValidAccessToken = function (data) {
  if (!data || !data.access_token || !data.expires_in) {
    return false
  }

  var expires_in = data.expires_in
  var now = new Date().getTime()

  if (now < expires_in) {
    return true
  } else {
    return false
  }
}

// 在weChat的原型链上增加更新票据的方法
weChat.prototype.updateAccessToken = function () {
  var appID = this.appID
  var appsecret = this.appsecret
  var url = api.accessToken + '&appid=' + appID + '&secret=' + appsecret

  return new Promise(function (resolve, reject) {
    request({
      url: url,
      json: true
    }).then(function (response) {
      var data = response.body
      var now = new Date().getTime()
      var expires_in = now + (data.expires_in - 20) * 1000
      data.expires_in = expires_in
      resolve(data)
    })
  })
}

// 在weChat的原型链上增加reply方法
weChat.prototype.reply = function () {
  var content = this.body
  var message = this.weixin
  var xml = tools.template(content, message)

  this.status = 200
  this.type = 'application/xml'
  this.body = xml
}

// 在weChat的原型链上增加uploadMaterial方法 用来新增临时素材
weChat.prototype.uploadMaterial = function (type, material, permanent) {
  var that = this
  // 构造表单对象
  var form = {}
  // 默认新增临时素材
  var uploadUrl = api.temporary.upload
  // 对permanent参数进行判断 如果传入permanent参数 则新增永久素材
  if (permanent) {
    uploadUrl = api.permanent.upload
    // 让form兼容所有的上传类型
    _.extend(form, permanent)
  }
  // 判断上传类型 指定对应的uploadUrl material如果是图文的时候传进来的是一个数组 如果是图片或视频的话 传进来的是一个路径
  if (type === 'pic') {
    uploadUrl = api.permanent.uploadNewsPic
  }
  if (type === 'news') {
    uploadUrl = api.permanent.uploadNews
    form = material
  } else {
    form.media = fs.createReadStream(material)
  }

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = uploadUrl + 'access_token=' + data.access_token + '&type=' + type
      // 进行判断 如果不是永久素材 则上传临时素材
      if (!permanent) {
        url += '&type=' + type
      } else {
        form.access_token = data.access_token
      }
      // 定义上传的参数
      var options = {
        method: 'POST',
        url: url,
        json: true
      }
      // 素材类型不同 上传方式不同
      if (type === 'news') {
        options.body = form
      } else {
        options.formData = form
      }

      request(options)
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Upload Material fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加fetchMaterial方法 用来获取素材
weChat.prototype.fetchMaterial = function (mediaId, type, permanent) {
  var that = this
  // 默认获取临时素材
  var fetchUrl = api.temporary.fetch
  // 对permanent参数进行判断 如果传入permanent参数 则获取永久素材
  if (permanent) {
    fetchUrl = api.permanent.fetch
  }
  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = fetchUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId
      var options = {
        method: 'POST',
        url: url,
        json: true
      }
      var form = {}
      if (permanent) {
        form.media_id = mediaId
        form.access_token = data.access_token
        options.body = form
      } else {
        if (type === 'video') {
          url = url.replace('https://', 'http://')
        }
        url += '&media_id=' + mediaId
      }

      if (type === 'news' || type === 'video') {
        request(options).then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('fetch Material fail')
          }
        })
      } else {
        resolve(url)
      }
    })
  })
}

// 在weChat的原型链上增加deleteMaterial方法 用来删除永久素材
weChat.prototype.deleteMaterial = function (mediaId) {
  var that = this
  // 创建form对象
  var form = {
    media_id: mediaId
  }
  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId

      request({
          method: 'POST',
          url: url,
          body: form,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Delete Material fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加updateMaterial方法 用来修改永久素材
weChat.prototype.updateMaterial = function (mediaId, news) {
  var that = this
  // 创建form对象
  var form = {
    media_id: mediaId
  }
  // 让form继承传进来的news
  _.extend(form, news)
  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId

      request({
          method: 'POST',
          url: url,
          body: form,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Update Material fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加countMaterial方法 用来获取永久素材总数
weChat.prototype.countMaterial = function () {
  var that = this
  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.permanent.count + 'access_token=' + data.access_token

      request({
          method: 'GET',
          url: url,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Count Material fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加countMaterial方法 用来批量获取永久素材总数
weChat.prototype.batchMaterial = function (options) {
  var that = this

  // 设置变量值
  options.type = options.type || 'image'
  options.offset = options.offset || 0
  options.count = options.count || 1

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.permanent.batch + 'access_token=' + data.access_token

      request({
          method: 'POST',
          url: url,
          body: options,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('batch Material fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加createTag方法 用来创建用户标签
weChat.prototype.createTag = function (name) {
  var that = this

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.tag.create + 'access_token=' + data.access_token
      var form = {
        tag: {
          name: name
        }
      }

      request({
          method: 'POST',
          url: url,
          body: form,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Create tag fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加fetchTag方法 用来获取用户标签
weChat.prototype.fetchTag = function () {
  var that = this

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.tag.fetch + 'access_token=' + data.access_token

      request({
          url: url,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Get tag fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加updateTag方法 用来编辑用户标签
weChat.prototype.updateTag = function (id, name) {
  var that = this

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.tag.update + 'access_token=' + data.access_token
      var form = {
        tag: {
          id: id,
          name: name
        }
      }

      request({
          method: 'POST',
          url: url,
          body: form,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Update tag fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加delTag方法 用来删除用户标签
weChat.prototype.delTag = function (id) {
  var that = this

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.tag.del + 'access_token=' + data.access_token
      var form = {
        tag: {
          id: id
        }
      }

      request({
          method: 'POST',
          url: url,
          body: form,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Delete tag fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加remarkUser方法 修改用户备注
weChat.prototype.remarkUser = function (openId, remark) {
  var that = this

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.user.remark + 'access_token=' + data.access_token
      var form = {
        openid: openId,
        remark: remark
      }

      request({
          method: 'POST',
          url: url,
          body: form,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Remark user fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加fetchUsers方法 获取用户基本信息
weChat.prototype.fetchUsers = function (openIds, lang) {
  var that = this
  lang = lang || 'zh_CN'

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var options = {
        json: true
      }
      if (_.isArray(openIds)) {
        options.url = api.user.batchFetch + 'access_token=' + data.access_token
        options.body = {
          user_list: openIds
        }
        options.method = 'POST'
      } else {
        options.url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openIds + '&lang=' + lang
      }

      request(options)
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Fetch user fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加listUsers方法 获取用户列表
weChat.prototype.listUsers = function (openId) {
  var that = this

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.user.list + 'access_token=' + data.access_token
      if (openId) {
        url += '&next_openid=' + openId
      }

      request({
          method: 'GET',
          url: url,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('List user fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加sendByTag方法 根据标签群发消息
weChat.prototype.sendByTag = function (type, message, tagId) {
  var that = this
  var msg = {
    filter: {},
    msgtype: type
  }

  msg[type] = message
  // 对传入的用户标签进行判断 如果有就针对用户发消息 如果没有就对所有用户发消息
  if (!tagId) {
    msg.filter.is_to_all = true
  } else {
    msg.filter = {
      is_to_all: false,
      tag_id: tagId
    }
  }

  return new Promise(function (resolve, reject) {
    that.fetchAccessToken().then(function (data) {
      var url = api.mass.tag + 'access_token=' + data.access_token

      request({
          method: 'POST',
          url: url,
          body: msg,
          json: true
        })
        .then(function (response) {
          var _data = response.body
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Send to tag user fail')
          }
        })
        .catch(function (err) {
          reject(err)
        })
    })
  })
}

// 在weChat的原型链上增加sendByOpenId方法 用来根据openID群发消息
weChat.prototype.sendByOpenId = function (type, message, openIds) {
  var that = this
  var msg = {
    msgtype: type,
    touser: openIds
  }
  msg[type] = message

  return new Promise(function (resolve, reject) {
    that
      .fetchAccessToken()
      .then(function (data) {
        var url = api.mass.openId + 'access_token=' + data.access_token

        request({
            method: 'POST',
            url: url,
            body: msg,
            json: true
          })
          .then(function (response) {
            var _data = response.body
            if (_data) {
              resolve(_data)
            } else {
              throw new Error('Send message by openid fail')
            }
          })
          .catch(function (err) {
            reject(err)
          })
      })
  })
}

// 在weChat的原型链上增加delMess方法 用来删除群发消息
weChat.prototype.delMess = function (msgId) {
  var that = this

  return new Promise(function (resolve, reject) {
    that
      .fetchAccessToken()
      .then(function (data) {
        var url = api.mass.openId + 'access_token=' + data.access_token
        var msg = {
          msg_id: msgId
        }

        request({
            method: 'POST',
            url: url,
            body: msg,
            json: true
          })
          .then(function (response) {
            var _data = response.body
            if (_data) {
              resolve(_data)
            } else {
              throw new Error('Delete message fail')
            }
          })
          .catch(function (err) {
            reject(err)
          })
      })
  })
}

// 在weChat的原型链上增加previewMess方法 用来预览群发消息
weChat.prototype.previewMess = function (type, message, openId) {
  var that = this
  var msg = {
    msgtype: type,
    touser: openId
  }
  msg[type] = message

  return new Promise(function (resolve, reject) {
    that
      .fetchAccessToken()
      .then(function (data) {
        var url = api.mass.preview + 'access_token=' + data.access_token

        request({
            method: 'POST',
            url: url,
            body: msg,
            json: true
          })
          .then(function (response) {
            var _data = response.body
            if (_data) {
              resolve(_data)
            } else {
              throw new Error('Preview message fail')
            }
          })
          .catch(function (err) {
            reject(err)
          })
      })
  })
}

// 在weChat的原型链上增加checkMess方法 用来查询群发消息发送状态
weChat.prototype.checkMess = function (msgId) {
  var that = this

  return new Promise(function (resolve, reject) {
    that
      .fetchAccessToken()
      .then(function (data) {
        var url = api.mass.check + 'access_token=' + data.access_token
        var form = {
          msg_id: msgId
        }

        request({
            method: 'POST',
            url: url,
            body: form,
            json: true
          })
          .then(function (response) {
            var _data = response.body
            if (_data) {
              resolve(_data)
            } else {
              throw new Error('Check message fail')
            }
          })
          .catch(function (err) {
            reject(err)
          })
      })
  })
}

// 在weChat的原型链上增加createMenu方法 用来创建自定义菜单
weChat.prototype.createMenu = function (menu) {
  var that = this

  return new Promise(function (resolve, reject) {
    that
      .fetchAccessToken()
      .then(function (data) {
        var url = api.menu.create + 'access_token=' + data.access_token

        request({
            method: 'POST',
            url: url,
            body: menu,
            json: true
          })
          .then(function (response) {
            var _data = response.body
            if (_data) {
              resolve(_data)
            } else {
              throw new Error('Create menu fail')
            }
          })
          .catch(function (err) {
            reject(err)
          })
      })
  })
}

// 在weChat的原型链上增加getMenu方法 用来获取自定义菜单
weChat.prototype.getMenu = function () {
  var that = this

  return new Promise(function (resolve, reject) {
    that
      .fetchAccessToken()
      .then(function (data) {
        var url = api.menu.fetch + 'access_token=' + data.access_token

        request({
            url: url,
            json: true
          })
          .then(function (response) {
            var _data = response.body
            if (_data) {
              resolve(_data)
            } else {
              throw new Error('Get menu fail')
            }
          })
          .catch(function (err) {
            reject(err)
          })
      })
  })
}

// 在weChat的原型链上增加delMenu方法 用来删除自定义菜单
weChat.prototype.delMenu = function () {
  var that = this

  return new Promise(function (resolve, reject) {
    that
      .fetchAccessToken()
      .then(function (data) {
        var url = api.menu.del + 'access_token=' + data.access_token

        request({
            url: url,
            json: true
          })
          .then(function (response) {
            var _data = response.body
            if (_data) {
              resolve(_data)
            } else {
              throw new Error('Delete menu fail')
            }
          })
          .catch(function (err) {
            reject(err)
          })
      })
  })
}

// 在weChat的原型链上增加getCurrentMenu方法 用来删除自定义菜单
weChat.prototype.getCurrentMenu = function () {
  var that = this

  return new Promise(function (resolve, reject) {
    that
      .fetchAccessToken()
      .then(function (data) {
        var url = api.menu.current + 'access_token=' + data.access_token

        request({
            url: url,
            json: true
          })
          .then(function (response) {
            var _data = response.body
            if (_data) {
              resolve(_data)
            } else {
              throw new Error('Get current menu fail')
            }
          })
          .catch(function (err) {
            reject(err)
          })
      })
  })
}

module.exports = weChat