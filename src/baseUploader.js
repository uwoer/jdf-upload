'use strict';

const fs = require('fs');
const path = require('path');
const base = require('jdf-utils').base;
const logger = require('jdf-log');

module.exports = class BaseUploader {
  constructor(options) {
    this.options = options;
  }

  startUpload(upPath) {
    return this.upload(this.options.root, this.options.target, upPath)
      .then(() => {
        const remotePath = base.pathJoin(this.options.host, this.options.target);
        logger.info(`upload to ${remotePath} success`);
      })
      .catch((err) => {
        logger.error(err);
      });
  }

  /**
   * 内容上传函数
   * @param root
   * @param target
   * @param upPath
   */
  upload(root, target, upPath) { // eslint-disable-line
    throw new Error('upload() in BaseUploader is an abstract method');
  }

  /**
   * 获取上传文件的信息，上传文件的类型和路径
   * @param Array upPath
   * @returns {*}
   */
  getUploadInfo(upPath) {
    if (upPath) {
      if (Object.prototype.toString.call(upPath) === '[object Array]') {
        upPath = upPath.length === 0 ? ['.'] : upPath;
      } else {
        upPath = [upPath];
      }
    } else {
      upPath = ['.'];
    }
    const root = this.options.root;
    const projectPath = this.options.projectPath;

    return upPath.map((item) => {
      const filePath = path.resolve(root, projectPath, item);
      let info = null;
      if (!fs.existsSync(filePath)) {
        logger.warn(`upload file ${item} is not exist`);
      } else {
        const stat = fs.lstatSync(filePath);
        item = base.pathJoin(projectPath, item);
        if (stat.isDirectory()) {
          item = item.slice(-1) === '/' ? item : `${item}/`;
          info = {
            type: 'dir',
            path: item,
            glob: `${item}**`,
          };
        } else {
          info = {
            type: 'file',
            path: item,
            glob: item,
          }
        }
      }
      logger.debug('uploadInfo: %j', info);
      return info;
    }).filter(item => item !== null);
  }

  static create(type, options) {
    const Uploader = require(`./${type}`); // eslint-disable-line
    return new Uploader(options);
  }
}
