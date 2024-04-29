import * as vscode from 'vscode'
import * as path from 'path'

import { FileUtil } from '../../util/file.util'
import { FXGCommandType } from '../../manager/command.manager'

enum IntlTreeItemType {
  project,
  arbFile,
  allJson,
}

class IntlTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,

    public readonly subTreeItems: IntlTreeItem[],
    public readonly itemType: IntlTreeItemType,
    public readonly itemPath: string,
    public readonly projectName: string,
    public readonly projectDir: string,
    public readonly command?: vscode.Command,

  ) {
    super(label, collapsibleState)

    if (itemType === IntlTreeItemType.project) {
      this.iconPath = new vscode.ThemeIcon('project')
    } else if (itemType === IntlTreeItemType.allJson) {
      this.iconPath = new vscode.ThemeIcon('json')
    } else if (itemType === IntlTreeItemType.arbFile) {
      this.iconPath = new vscode.ThemeIcon('file')
    }
  }
}

export class IntlTreeView implements vscode.TreeDataProvider<IntlTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<IntlTreeItem | undefined | null | void> = new vscode.EventEmitter<IntlTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<IntlTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  public id: string
  public rootPath: string
  public workspaceDirs: string[]

  public treeItems: IntlTreeItem[] = []
  constructor(id: string, rootPath: string, workspaceDirs: string[]) {
    this.id = id
    this.rootPath = rootPath
    this.workspaceDirs = workspaceDirs

    this.setup()
  }

  async setup() {
    this.treeItems = []

    // 当前项目
    let rootProjectItem: IntlTreeItem = await this.assembleIntlTreeItem(this.rootPath)
    this.treeItems.push(rootProjectItem)

    // 其他子项目
    for (let p of this.workspaceDirs) {
      if (p === this.rootPath) {
        continue;
      }
      let subProjectItems: IntlTreeItem = await this.assembleIntlTreeItem(this.rootPath)
      this.treeItems.push(subProjectItems)
    }

    // refresh
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: IntlTreeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: IntlTreeItem): Thenable<IntlTreeItem[]> {
    if (this.rootPath.length === 0) {
      vscode.window.showInformationMessage('打开文件夹')
      return Promise.resolve([])
    }
    if (this.treeItems.length === 0) {
      console.log("intl.tree_view, treeItems is empty")
      return Promise.resolve([])
    }
    if (element && element !== undefined && element.itemType === IntlTreeItemType.project) {
      // leaf
      let leafs: IntlTreeItem[] = []
      for (let e of this.treeItems) {
        leafs = [...leafs, ...e.subTreeItems]
      }
      return Promise.resolve(leafs)
    } else {
      // branch
      return Promise.resolve(this.treeItems)
    }
  }

  private async assembleIntlTreeItem(projectDir: string): Promise<IntlTreeItem> {
    let projectTreeItem: IntlTreeItem | null = null
    try {
      let rootArbFilePaths: string[] = FileUtil.getProjectAllArbFiles(projectDir)
      let pubspecData: any = await FileUtil.readYamlFile(`${projectDir}/pubspec.yaml`)
      let projectName: string = pubspecData["name"]

      // child tree items
      let subTreeItems: IntlTreeItem[] = []

      // arb file json
      let allArbJsonItem: IntlTreeItem = new IntlTreeItem(
        "all_arb_file_data.json",
        vscode.TreeItemCollapsibleState.None,
        [],
        IntlTreeItemType.allJson,
        "",
        projectName,
        projectDir,
        {
          title: FXGCommandType.openWebView,
          command: FXGCommandType.openWebView,
          arguments: [rootArbFilePaths],
        },
      );
      subTreeItems.push(allArbJsonItem)

      // arb file
      for (let p of rootArbFilePaths) {
        let fileName = p.replaceAll(path.join(projectDir, 'lib', 'l10n/'), '')
        let arbFileItem: IntlTreeItem = new IntlTreeItem(
          fileName,
          vscode.TreeItemCollapsibleState.None,
          [],
          IntlTreeItemType.arbFile,
          "",
          projectName,
          projectDir,
          {
            title: FXGCommandType.openFile,
            command: FXGCommandType.openFile,
            arguments: [p],
          },
        );
        subTreeItems.push(arbFileItem)
      }

      // project folder
      projectTreeItem = new IntlTreeItem(
        projectName,
        vscode.TreeItemCollapsibleState.Expanded,
        subTreeItems,
        IntlTreeItemType.project,
        "",
        projectName,
        projectDir,
        null,
      );
    } catch (error) {
      console.log("assembleIntlTreeItem, error: ", error)
    }

    return Promise.resolve(projectTreeItem)
  }

  // private allLocalizationFileToFileItem(l10nDir: string): IntlTreeItem[] {
  //   if (!FileUtil.pathExists(l10nDir)) {
  //     return []
  //   }
  //   let results: FileItem[] = []
  //   let allFilePaths = FileUtil.getDirAllFiles(l10nDir)
  //   for (let p of allFilePaths) {
  //     let name = p.replaceAll(path.join(this.workspace, 'lib', 'l10n/'), '')
  //     let commandData = CommandManager.getInstance().internalCommands[FXGCommandType.openWebView]
  //     let item = new FileItem(
  //       vscode.TreeItemCollapsibleState.None,
  //       name,
  //       p,
  //       this.workspace,
  //       {
  //         title: commandData.title,
  //         command: commandData.command,
  //         arguments: [p],
  //       }
  //     )
  //     results.push(item)
  //   }
  //   return results
  // }
}
