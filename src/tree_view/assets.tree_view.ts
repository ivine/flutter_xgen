import * as vscode from 'vscode'

import { FileUtil } from '../util/file.util'
import { FXGCommandType } from '../manager/command.manager'

import { TreeNodeType, AssetsTreeNode } from './tree_node'
import TreeViewUtil from './tree_view.util'


export class AssetsTreeView implements vscode.TreeDataProvider<AssetsTreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<AssetsTreeNode | undefined | null | void> = new vscode.EventEmitter<AssetsTreeNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<AssetsTreeNode | undefined | null | void> = this._onDidChangeTreeData.event;

  public id: string
  public rootPath: string
  public workspaceDirs: string[]

  public treeNodes: AssetsTreeNode[] = []
  constructor(id: string, rootPath: string, workspaceDirs: string[]) {
    this.id = id
    this.rootPath = rootPath
    this.workspaceDirs = workspaceDirs

    this.setup()
  }

  async setup() {
    this.treeNodes = []

    // 当前项目
    let rootProjectItem: AssetsTreeNode = await this.assembleProjectTreeItem(this.rootPath)
    this.treeNodes.push(rootProjectItem)

    // 其他子项目
    for (let proj of this.workspaceDirs) {
      if (proj === this.rootPath) {
        continue;
      }
      let subProjectItems: AssetsTreeNode = await this.assembleProjectTreeItem(proj)
      this.treeNodes.push(subProjectItems)
    }

    // refresh
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: AssetsTreeNode): vscode.TreeItem {
    return element
  }

  getChildren(element?: AssetsTreeNode): Thenable<AssetsTreeNode[]> {
    if (this.rootPath.length === 0) {
      return Promise.resolve([])
    }
    if (this.treeNodes.length === 0) {
      console.log("getChildren, treeNodes is empty")
      return Promise.resolve([])
    }
    if (element && element !== undefined && element.nodeType === TreeNodeType.folder) {
      // current element is branch, return leafs
      return Promise.resolve(element.subTreeNodes)
    } else {
      // root
      return Promise.resolve(this.treeNodes)
    }
  }

  resolveTreeItem?(item: AssetsTreeNode, element: AssetsTreeNode, token: vscode.CancellationToken): vscode.ProviderResult<AssetsTreeNode> {
    return item
  }

  private async assembleProjectTreeItem(projectDir: string): Promise<AssetsTreeNode | null> {
    let pubspecPath: string = `${projectDir}/pubspec.yaml`
    if (!FileUtil.pathExists(pubspecPath)) {
      console.log(`assembleProjectTreeItem, pubspecPath: ${pubspecPath} is not exist`)
      return Promise.resolve(null)
    }
    let pubspecData: any | null = await FileUtil.readYamlFile(pubspecPath)
    if (pubspecData === null) {
      return Promise.resolve(null)
    }

    let projectName: string = pubspecData["name"]
    let validAssetsRelativePaths: string[] = pubspecData["flutter"]["assets"]

    let rootAssetsPath = `${projectDir}/assets`
    if (!FileUtil.pathExists(rootAssetsPath)) {
      console.log(`assembleProjectTreeItem, rootAssetsPath: ${rootAssetsPath} is not exist`)
      return Promise.resolve(null)
    }
    let rootAssetsFilePaths: string[] = FileUtil.getDirAllFiles(rootAssetsPath)
    let subTreeNodes: AssetsTreeNode[] = []
    for (let p of rootAssetsFilePaths) {
      let item: AssetsTreeNode | null = await this.assembleTreeItem(projectDir, projectName, p, validAssetsRelativePaths)
      if (item == null) {
        continue;
      }
      subTreeNodes.push(item)
    }

    subTreeNodes = TreeViewUtil.sortTreeNodeList<AssetsTreeNode>(subTreeNodes) // 排序
    let treeItem: AssetsTreeNode = new AssetsTreeNode(
      "assets",
      vscode.TreeItemCollapsibleState.Expanded,

      TreeNodeType.folder,
      projectDir,
      projectName,
      subTreeNodes,
      rootAssetsPath,
      null,

      true,
    );
    return Promise.resolve(treeItem)
  }

  private async assembleTreeItem(
    projectDir: string,
    projectName: string,
    itemPath: string,
    validAssetsRelativePaths: string[],
  ): Promise<AssetsTreeNode> {
    let treeItem: AssetsTreeNode | null = null
    try {
      let itemName = FileUtil.getFileNameWithExtension(itemPath)
      let itemRelativePath: string = itemPath.replaceAll(projectDir, "")
      let isDir: boolean = await FileUtil.checkIfPathIsDir(itemPath)
      let validPath: boolean = true
      let subTreeNodes: AssetsTreeNode[] = []
      if (isDir) {
        // 1.检查目录是否有效
        validPath = false
        for (let p of validAssetsRelativePaths) {
          if (itemRelativePath.startsWith(p)) {
            validPath = true
            break;
          }
        }

        // 2.子路径
        let rootAssetsFilePaths: string[] = FileUtil.getDirAllFiles(itemPath)
        for (let p of rootAssetsFilePaths) {
          let item: AssetsTreeNode | null = await this.assembleTreeItem(projectDir, projectName, p, validAssetsRelativePaths)
          if (item == null) {
            continue;
          }
          subTreeNodes.push(item)
        }
      }

      subTreeNodes = TreeViewUtil.sortTreeNodeList<AssetsTreeNode>(subTreeNodes) // 排序
      treeItem = new AssetsTreeNode(
        itemName,
        isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,

        isDir ? TreeNodeType.folder : TreeNodeType.file,
        projectDir,
        projectName,
        subTreeNodes,
        itemPath,
        isDir ? null : {
          title: FXGCommandType.openFile,
          command: FXGCommandType.openFile,
          arguments: [itemPath],
        },

        validPath,
      );
    } catch (error) {
      console.log("assembleTreeItem, error: ", error)
    }

    return Promise.resolve(treeItem)
  }
}
