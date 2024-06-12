import * as fs from 'fs'
import * as vscode from 'vscode'

import _ from 'lodash'

import { getExtensionContext } from '../extension'
import { generateRandomString } from '../util/string.util'

export type WatcherEventCallback = (eventType: WatcherEventType, uri: vscode.Uri) => void

export enum WatcherEventType {
  onCreated = "onCreated",
  onChanged = "onChanged",
  onDeleted = "onDeleted",
}

// TODO: 在项目打开后开始自动监听
export default class WatcherManager {
  private static instance: WatcherManager | null = null
  private rootPath: string = ""

  // Watcher list
  private watcherList: FileWatcher[] = []

  private constructor() { }

  static getInstance(): WatcherManager {
    // TODO: 在vscode窗口打开的时候开启
    if (!WatcherManager.instance) {
      WatcherManager.instance = new WatcherManager()
    }
    return WatcherManager.instance
  }

  public setup(rootPath: string) {
    this.rootPath = rootPath
  }

  public dispose() {
    for (let watcher of this.watcherList) {
      watcher.stop()
    }
    this.watcherList = []
  }

  public createWatch(
    projectDir: string,
    targetDir: string,
    callback: (eventType: WatcherEventType, uri: vscode.Uri) => void
  ): FileWatcher {
    let watcher = new FileWatcher(projectDir, targetDir)
    let result = _.find(this.watcherList, function (o) { return o.id === watcher.id })
    if (result) {
      watcher = result
    } else {
      watcher.addCallback(callback)
      watcher.start()
      this.watcherList.push(watcher)
    }
    return watcher
  }

  public stopWatch(watcher: FileWatcher | null) {
    if (!watcher) {
      return
    }
    let result = _.find(this.watcherList, function (o) { return o.id < watcher.id })
    if (!result) {
      console.info("WatcherManager - stopWatch, can not find watcher")
      return
    }
    watcher.stop()
  }
}

export class FileWatcher {
  id: string
  projectPath: string
  targetDir: string
  watcher: vscode.FileSystemWatcher | null = null
  callbackList: WatcherEventCallback[] = []

  constructor(projectPath: string, targetDir: string) {
    this.projectPath = projectPath
    this.id = `${targetDir}_${generateRandomString()}`
    this.targetDir = targetDir
  }

  public start() {
    this.stop()

    this.watcher = vscode.workspace.createFileSystemWatcher(`${this.targetDir}/**/*`)
    this.watcher.onDidCreate((uri) => {
      this.onWatchingEvent(WatcherEventType.onCreated, uri)
    })
    this.watcher.onDidChange((uri) => {
      this.onWatchingEvent(WatcherEventType.onChanged, uri)
    })
    this.watcher.onDidDelete((uri) => {
      this.onWatchingEvent(WatcherEventType.onDeleted, uri)
    })
    getExtensionContext().subscriptions.push(this.watcher)

    vscode.window.setStatusBarMessage(`Flutter XGen: ${this.targetDir} 文件夹监听已开启`, 3000)
  }

  public stop() {
    this.watcher?.dispose()
    this.watcher = null
  }

  public addCallback(cb: WatcherEventCallback) {
    this.removeCallback(cb)
    this.callbackList.push(cb)
  }

  public removeCallback(cb: WatcherEventCallback) {
    let newList: WatcherEventCallback[] = []
    for (let tmpCb of this.callbackList) {
      if (tmpCb === cb) {
        continue
      }
      newList.push(tmpCb)
    }
    this.callbackList = newList
  }

  public onWatchingEvent(event: WatcherEventType, uri: vscode.Uri) {
    for (let cb of this.callbackList) {
      try {
        cb(event, uri)
      } catch (error) {
        //
        console.log("onWatchingEvent, error: ", error)
      }
    }
  }
}