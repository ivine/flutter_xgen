// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

import CommandManager from './manager/command.manager'

import WatcherManager from './manager/watcher.manager'
import TreeViewManager from './manager/tree_view.manager'
import WorkspaceManager from './manager/workspace.manager'
import StoreManager from './manager/store.manager'

let globalContext: vscode.ExtensionContext
function initializeExtension(context: vscode.ExtensionContext) {
  globalContext = context
}
export function getExtensionContext(): vscode.ExtensionContext | null {
  return globalContext
}

function workspaceDir(): string | null {
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    // 获取第一个工作区的路径
    const workspaceFolder = vscode.workspace.workspaceFolders[0]
    return workspaceFolder.uri.fsPath
  } else {
    // 没有打开的工作区
    return null
  }
}

const setupManager = () => {
  // manager 初始化
  const wsDir = workspaceDir()
  CommandManager.getInstance().setup()
  StoreManager.getInstance().setup(wsDir)
  WatcherManager.getInstance().setup(wsDir)
  WorkspaceManager.getInstance().setup(wsDir)
  TreeViewManager.getInstance().setup(wsDir)
}

export function activate(context: vscode.ExtensionContext) {
  initializeExtension(context)

  // 每次切换 文件夹/workspace 的时候，都会触发
  setupManager()
}

export function deactivate() {
  WatcherManager.getInstance().dispose()
}
