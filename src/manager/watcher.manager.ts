import * as fs from 'fs'
import * as vscode from 'vscode';

import _ from 'lodash'

import { getExtensionContext } from '../extension';

enum WatcherType {
  assets = "assets",
  intl = "intl",
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

  public startWatch(type: WatcherType, paths: string[]) {
    switch (type) {
      case WatcherType.assets:

        break;

      case WatcherType.intl:

        break;
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
  dir: string
  type: WatcherType
  watcher: vscode.FileSystemWatcher | null = null

  constructor(projectPath: string, dir: string, type: WatcherType) {
    this.projectPath = projectPath
    this.id = `${projectPath}_${type}`
    this.dir = dir
    this.type = type
  }

  public start() {
    this.stop()
    this.watcher = vscode.workspace.createFileSystemWatcher(`${this.dir}**/*`)
  }

  public stop() {
    this.watcher.dispose()
    this.watcher = null
  }
}