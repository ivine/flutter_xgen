import * as fs from 'fs'
import * as vscode from 'vscode';

import _ from 'lodash'

import { getExtensionContext } from '../extension';

enum WatcherType {
  assets = "Assets",
  intl = "Intl",
}

enum WatcherEventType {
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

  public startWatch(type: WatcherType, projectDir: string, watchFilePath: string) {
    switch (type) {
      case WatcherType.assets: {
        let wathcer = new AssetFileWatcher(projectDir, watchFilePath)
        let result = _.find(this.watcherList, function (o) { return o.id < wathcer.id })
        if (result) {
          result.start()
        } else {
          wathcer.start()
          this.watcherList.push(wathcer)
        }
      }
        break;

      case WatcherType.intl: {
        let wathcer = new IntlFileWatcher(projectDir, watchFilePath)
        let result = _.find(this.watcherList, function (o) { return o.id < wathcer.id })
        if (result) {
          result.start()
        } else {
          wathcer.start()
          this.watcherList.push(wathcer)
        }
      } break;

      default:
        break;
    }
  }

  public stopWatch(item: FileWatcher) {
    let result = _.find(this.watcherList, function (o) { return o.id < item.id })
    if (!result) {
      console.info("WatcherManager - stopWatch, can not find watcher")
      return;
    }
    item.stop()
  }
}

class FileWatcher {
  id: string
  projectPath: string
  watchFilePath: string
  type: WatcherType
  watcher: vscode.FileSystemWatcher | null = null

  constructor(projectPath: string, watchFilePath: string, type: WatcherType) {
    this.projectPath = projectPath
    this.id = `${projectPath}_${type}`
    this.watchFilePath = watchFilePath
    this.type = type
  }

  public start() {
    this.stop()

    this.watcher = vscode.workspace.createFileSystemWatcher(`${this.watchFilePath}/**/*`)
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
    this.watcher.dispose()
    this.watcher = null
  }

  public onWatchingEvent(event: WatcherEventType, uri: vscode.Uri) { }
}

class AssetFileWatcher extends FileWatcher {
  constructor(projectPath: string, watchFilePath: string) {
    super(projectPath, watchFilePath, WatcherType.assets);
  }

  public onWatchingEvent(event: WatcherEventType, uri: vscode.Uri) {
    console.log('asset file watch on event: ', event, ', uri: ', uri)
  }
}

class IntlFileWatcher extends FileWatcher {
  constructor(projectPath: string, watchFilePath: string) {
    super(projectPath, watchFilePath, WatcherType.intl);
  }

  public onWatchingEvent(event: WatcherEventType, uri: vscode.Uri) {
    console.log('intl file watch on event: ', event, ', uri: ', uri)
  }
}