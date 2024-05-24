import * as fs from 'fs'
import * as vscode from 'vscode'

import _ from 'lodash'

import { getExtensionContext } from '../extension'

export type WatcherEventCallback = (eventType: WatcherEventType, uri: vscode.Uri) => void

export enum WatcherType {
  assets = "Assets",
  intl = "Intl",
}

export enum WatcherEventType {
  onCreated = "onCreated",
  onChanged = "onChanged",
  onDeleted = "onDeleted",
}

export default class WatcherManager {
  private static instance: WatcherManager | null = null
  private rootPath: string = ""

  // Watcher list
  private watcherList: FileWatcher[] = []

  private constructor() { }

  static getInstance(): WatcherManager {
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
    type: WatcherType,
    projectDir: string,
    targetDir: string,
    callback: (eventType: WatcherEventType, uri: vscode.Uri) => void
  ): FileWatcher | null {
    let resWatcher: FileWatcher | null = null
    switch (type) {
      case WatcherType.assets: {
        let watcher = new AssetFileWatcher(projectDir, targetDir)
        let result = _.find(this.watcherList, function (o) { return o.id < watcher.id })
        if (result) {
          result.addCallback(callback)
        } else {
          watcher.start()
          this.watcherList.push(watcher)
        }
        resWatcher = watcher
      }
        break

      case WatcherType.intl: {
        let watcher = new IntlFileWatcher(projectDir, targetDir)
        let result = _.find(this.watcherList, function (o) { return o.id < watcher.id })
        if (result) {
          result.addCallback(callback)
        } else {
          watcher.start()
          this.watcherList.push(watcher)
        }
        resWatcher = watcher
      } break

      default:
        break
    }
    return resWatcher
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
  type: WatcherType
  watcher: vscode.FileSystemWatcher | null = null
  callbackList: WatcherEventCallback[] = []

  constructor(projectPath: string, targetDir: string, type: WatcherType) {
    this.projectPath = projectPath
    this.id = `${projectPath}_${type}`
    this.targetDir = targetDir
    this.type = type
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

    vscode.window.setStatusBarMessage(`Flutter XGen: ${this.type} 文件夹监听已开启`, 3000)
  }

  public stop() {
    this.callbackList = []
    this.watcher.dispose()
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

class AssetFileWatcher extends FileWatcher {
  constructor(projectPath: string, watchFilePath: string) {
    super(projectPath, watchFilePath, WatcherType.assets)
  }
}

class IntlFileWatcher extends FileWatcher {
  constructor(projectPath: string, watchFilePath: string) {
    super(projectPath, watchFilePath, WatcherType.intl)
  }
}