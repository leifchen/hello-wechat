'use strict'

const ejs = require('ejs')
const heredoc = require('heredoc')

// 针对不同的消息类型获取不同的模板
var template = heredoc(function () {
  /*
    <xml>
      <ToUserName><![CDATA[<%= toUserName %>]]></ToUserName>
      <FromUserName><![CDATA[<%= fromUserName %>]]></FromUserName>
      <CreateTime> <%= createTime %></CreateTime>
      <MsgType><![CDATA[<%= msgType %>]]></MsgType>
      <% if (msgType === 'text'){ %>
          <Content><![CDATA[<%= content %>]]></Content>
      <% } else if (msgType === 'image'){ %>
          <Image>
              <MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
          </Image>
      <% } else if (msgType === 'voice'){ %>
          <Voice>
              <MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
          </Voice>
      <% } else if (msgType === 'video'){ %>
          <Video>
              <MediaId><![CDATA[<%= content.mediaId %>]]></MediaId>
              <Title><![CDATA[<%= content.title %>]]></Title>
              <Description><![CDATA[<%= content.description %>]]></Description>
          </Video>
      <% } else if (msgType === 'music'){ %>
          <Music>
              <Title><![CDATA[<%= content.TITLE %>]]></Title>
              <Description><![CDATA[<%= content.DESCRIPTION %>]]></Description>
              <MusicUrl><![CDATA[<%= content.musicUrl %>]]></MusicUrl>
              <HQMusicUrl><![CDATA[<%= content.hqMusicUrl %>]]></HQMusicUrl>
              <ThumbMediaId><![CDATA[<%= content.thumbMediaId %>]]></ThumbMediaId>
          </Music>
       <% } else if (msgType === 'news') { %>
          <ArticleCount>1</ArticleCount>
          <Articles>
          <% content.forEach(function(item){ %>
            <item>
              <Title><![CDATA[<%= item.title %>]]></Title> 
              <Description><![CDATA[<%= item.description %>]]></Description>
              <PicUrl><![CDATA[<%= item.picUrl %>]]></PicUrl>
              <Url><![CDATA[<%= item.url %>]]></Url>
            </item>
          <% }) %>
          </Articles>        
      <% } %>
    </xml>
  */
})

// 编译template模板
var compiled = ejs.compile(template)

exports = module.exports = {
  compiled: compiled
}