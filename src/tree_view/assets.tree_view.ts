import * as vscode from 'vscode'

import { FileUtil } from '../util/file.util'
import { FXGCommandData, FXGCommandType, getFXGCommandData } from '../manager/command.manager'
import { InteractionEvent, InteractionEventType, InteractionProjectInfo } from '../manager/interaction.manager'

import { TreeNodeType, AssetsTreeNode } from './tree_node'
import TreeViewUtil from './tree_view.util'


export class AssetsTreeView implements vscode.TreeDataProvider<AssetsTreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<AssetsTreeNode | undefined | null | void> = new vscode.EventEmitter<AssetsTreeNode | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<AssetsTreeNode | undefined | null | void> = this._onDidChangeTreeData.event

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
        continue
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

  // MARK: - assemble

  private async assembleFileDirTreeNode(projectDir: string, projectName: string): Promise<AssetsTreeNode | null> {
    // let validAssetsRelativePaths: string[] = pubspecData["flutter"]["assets"] // TODO: 待开发
    const assetsDir = `${projectDir}/assets` // TODO: 路径应该也要读取

    let subNodes: AssetsTreeNode[] = []
    if (FileUtil.pathExists(assetsDir)) {
      const filePaths: string[] = FileUtil.getDirAllFiles(assetsDir) // 全部文件
      for (const path of filePaths) {
        let node: AssetsTreeNode | null = await this.assembleAssetsTreeNode(projectDir, projectName, path, [])
        if (node == null) {
          continue
        }
        subNodes.push(node)
      }
      subNodes = TreeViewUtil.sortTreeNodeList<AssetsTreeNode>(subNodes) // 排序
    } else {
      console.log(`assembleProjectTreeItem, rootAssetsPath: ${assetsDir} is not exist`)
    }

    const node: AssetsTreeNode = new AssetsTreeNode(
      "assets",
      vscode.TreeItemCollapsibleState.Collapsed,

      TreeNodeType.folder,
      projectDir,
      projectName,
      subNodes,
      "",
      null,

      true,
    )
    return node
  }

  private async assembleGeneratedDirTreeNode(projectDir: string, projectName: string,): Promise<AssetsTreeNode | null> {
    let fileNode: AssetsTreeNode = await this.assembleAssetsTreeNode(
      projectDir,
      projectName,
      `${projectDir}/lib/generated/assets.dart`,
      [],
    )
    let node: AssetsTreeNode = new AssetsTreeNode(
      "generated",
      vscode.TreeItemCollapsibleState.Collapsed,

      TreeNodeType.folder,
      projectDir,
      projectName,
      [fileNode],
      "",
      null,

      true,
    )
    return node
  }

  private async assembleProjectTreeItem(projectDir: string): Promise<AssetsTreeNode | null> {
    const pubspecPath: string = `${projectDir}/pubspec.yaml`
    if (!FileUtil.pathExists(pubspecPath)) {
      console.log(`assembleProjectTreeItem, pubspecPath: ${pubspecPath} is not exist`)
      return Promise.resolve(null)
    }
    const pubspecData: any | null = await FileUtil.readYamlFile(pubspecPath)
    if (pubspecData === null) {
      return Promise.resolve(null)
    }

    const projectName: string = pubspecData["name"]

    // preview node
    const previewNode: AssetsTreeNode = new AssetsTreeNode(
      "预览",
      vscode.TreeItemCollapsibleState.None,

      TreeNodeType.preview,
      projectDir,
      projectName,
      [],
      "",
      null,

      true,
    )

    // assets node
    const assetsNode = await this.assembleFileDirTreeNode(projectDir, projectName)

    // 生成文件 node
    const generatedNode = await this.assembleGeneratedDirTreeNode(projectDir, projectName)

    // 最后的树
    const rootNode: AssetsTreeNode = new AssetsTreeNode(
      projectName,
      vscode.TreeItemCollapsibleState.Expanded,

      TreeNodeType.folder,
      projectDir,
      projectName,
      [previewNode, generatedNode, assetsNode],
      "",
      null,

      true,
    )
    return Promise.resolve(rootNode)
  }

  private async assembleAssetsTreeNode(
    projectDir: string,
    projectName: string,
    itemPath: string,
    validAssetsRelativePaths: string[],
  ): Promise<AssetsTreeNode> {
    let rootNode: AssetsTreeNode | null = null
    try {
      let itemName = FileUtil.getFileNameWithExtension(itemPath)
      let itemRelativePath: string = itemPath.replaceAll(`${projectDir}/`, "")
      let isFolder: boolean = await FileUtil.checkIfPathIsDir(itemPath)
      let validPath: boolean = true
      let subTreeNodes: AssetsTreeNode[] = []
      if (isFolder) {
        // 1.检查目录是否有效
        validPath = true
        // TODO: 优化一下
        // for (let p of validAssetsRelativePaths) {
        //   // e.g.: itemRelativePath = assets/img/user/avatar + "/"", p = assets/img/user
        //   let matchResult = `${itemRelativePath}/`.replace(`${p}`, "") // 不包含 "/"，表示已经是最后一级文件夹，则该目录有效
        //   // console.log(`itemRelativePath: ${itemRelativePath}, p: ${p}, matchResult: ${matchResult}`)
        //   if (!matchResult.includes("/")) {
        //     validPath = true
        //     break
        //   }
        // }

        // 2.子路径
        let rootAssetsFilePaths: string[] = FileUtil.getDirAllFiles(itemPath)
        for (let p of rootAssetsFilePaths) {
          let item: AssetsTreeNode | null = await this.assembleAssetsTreeNode(projectDir, projectName, p, validAssetsRelativePaths)
          if (item == null) {
            continue
          }
          subTreeNodes.push(item)
        }
      } else {
        // 文件
      }

      let command: vscode.Command | null = null
      if (!isFolder) {
        command = await this.getTreeNodeCommand(projectDir, projectName, itemPath)
      }

      subTreeNodes = TreeViewUtil.sortTreeNodeList<AssetsTreeNode>(subTreeNodes) // 排序
      rootNode = new AssetsTreeNode(
        itemName,
        isFolder ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,

        isFolder ? TreeNodeType.folder : TreeNodeType.file,
        projectDir,
        projectName,
        subTreeNodes,
        itemPath,
        command,

        validPath,
      )
    } catch (error) {
      console.log("assembleTreeItem, error: ", error)
    }

    return Promise.resolve(rootNode)
  }

  // MARK: - Command

  async getTreeNodeCommand(
    projectDir: string,
    projectName: string,
    filePath: string,
  ): Promise<vscode.Command> {
    let resultCommand: vscode.Command | null = null
    let canTextDocPreview = await FileUtil.isFileSuitableForTextDocument(filePath)
    if (canTextDocPreview) {
      let commandData: FXGCommandData = getFXGCommandData(FXGCommandType.openFile)
      resultCommand = {
        title: commandData.title,
        command: commandData.command,
        arguments: [filePath]
      }
    } else {
      let commandData: FXGCommandData = getFXGCommandData(FXGCommandType.openFXGUIWeb)
      let projectInfo: InteractionProjectInfo = {
        dir: projectDir,
        name: projectName,
      }
      // let interactionEvent: InteractionEvent = {
      //   timestamp: new Date().getDate(),
      //   eventType: InteractionEventType.extToWeb_assets_previewItem,
      //   projectInfo: projectInfo,
      //   data: filePath,
      // }
      resultCommand = {
        title: commandData.title,
        command: commandData.command,
        arguments: [{}]
      }
    }
    return Promise.resolve(resultCommand)
  }
}
