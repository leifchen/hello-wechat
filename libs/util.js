'use strict'

const fs = require('fs')
const Promise = require('bluebird')

// 读取票据信息
exports.readFileAsync = function (fpath, encoding) {
    return new Promise(function (resolve, reject) {
        fs.readFile(fpath, encoding, function (err, content) {
            if (err) {
                reject(err)
            } else {
                resolve(content)
            }
        })
    })
}

// 写入票据信息
exports.writeFileAsync = function (fpath, content) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(fpath, content, function (err) {
            if (err) {
                reject(err)
            } else {
                resolve(content)
            }
        })
    })
}