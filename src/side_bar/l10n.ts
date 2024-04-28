import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { FileUtil } from '../util/file.util'
import CommandManager, { FXGCommandType } from '../manager/command.manager'

enum L10nTreeNodeType {
  project,
  json,
  file,
}

export class L10nSideBar implements vscode.TreeDataProvider<FXGTreeItem> {
  public id: string
  public workspace: string
  constructor(id: string, workspace: string) {
    this.id = id
    this.workspace = workspace
  }

  getTreeItem(element: FXGTreeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: FXGTreeItem): Thenable<FXGTreeItem[]> {
    if (!this.workspace) {
      vscode.window.showInformationMessage('打开文件夹')
      return Promise.resolve([])
    }

    let dir = path.join(this.workspace, 'lib', 'l10n')
    let files = this.allLocalizationFileToFileItem(dir)

    let items: FXGTreeItem[] = []
    if (element?.type === L10nTreeNodeType.project) {
      // json
      let commandData = CommandManager.getInstance().internalCommands[FXGCommandType.openWebView]
      let json = new JsonItem(
        vscode.TreeItemCollapsibleState.None,
        "main_lang.json",
        "",
        this.workspace,
        {
          title: commandData.title,
          command: commandData.command,
          arguments: [files.map((e) => e.filePath)],
        }
      )
      items.push(json)

      // files
      items = [...items, ...files]
    } else {
      // project
      let pi = new ProjectItem(
        vscode.TreeItemCollapsibleState.Expanded,
        "All_L10n_Files",
        path.join(this.workspace, 'pubspec.yaml'),
        this.workspace
      )
      items.push(pi)
    }
    return Promise.resolve(items)
  }

  private allLocalizationFileToFileItem(l10nDir: string): FileItem[] {
    if (!FileUtil.pathExists(l10nDir)) {
      return []
    }
    let results: FileItem[] = []
    let allFilePaths = FileUtil.getDirAllFiles(l10nDir)
    for (let p of allFilePaths) {
      let name = p.replaceAll(path.join(this.workspace, 'lib', 'l10n/'), '')
      let commandData = CommandManager.getInstance().internalCommands[FXGCommandType.openWebView]
      let item = new FileItem(
        vscode.TreeItemCollapsibleState.None,
        name,
        p,
        this.workspace,
        {
          title: commandData.title,
          command: commandData.command,
          arguments: [p],
        }
      )
      results.push(item)
    }
    return results
  }
}

class FXGTreeItem extends vscode.TreeItem {
  type: L10nTreeNodeType = L10nTreeNodeType.project
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemName: string,
    public readonly filePath: string,
    public readonly workspace: string,
    public readonly command?: vscode.Command,
  ) {
    super(itemName, collapsibleState)
  }
}

class ProjectItem extends FXGTreeItem {
  type: L10nTreeNodeType = L10nTreeNodeType.project
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemName: string,
    public readonly filePath: string,
    public readonly workspace: string,
    public readonly command?: vscode.Command,
  ) {
    super(collapsibleState, itemName, filePath, workspace, command)
  }
}

class JsonItem extends FXGTreeItem {
  type: L10nTreeNodeType = L10nTreeNodeType.json
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemName: string,
    public readonly filePath: string,
    public readonly workspace: string,
    public readonly command?: vscode.Command,
  ) {
    super(collapsibleState, itemName, filePath, workspace, command)
  }
}

class FileItem extends FXGTreeItem {
  type: L10nTreeNodeType = L10nTreeNodeType.file
  constructor(
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemName: string,
    public readonly filePath: string,
    public readonly workspace: string,
    public readonly command?: vscode.Command,
  ) {
    super(collapsibleState, itemName, filePath, workspace, command)
  }
}
