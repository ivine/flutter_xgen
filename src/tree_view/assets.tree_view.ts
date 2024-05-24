import * as vscode from 'vscode'

import FXGProject, { TreeViewRefreshCallback } from '../model/project'
import { FileUtil } from '../util/file.util'

import WorkspaceManager from '../manager/workspace.manager'
import { TreeViewType } from '../manager/tree_view.manager'
import { InteractionEvent, InteractionEventType } from '../manager/interaction.manager'
import { FXGCommandData, FXGCommandType, getFXGCommandData } from '../manager/command.manager'

import TreeViewUtil from './tree_view.util'
import { TreeNodeType, AssetsTreeNode } from './tree_node'

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

    this.setupRefreshCallback()
    this.setup()
  }

  refreshCallback: TreeViewRefreshCallback = (treeViewType: TreeViewType) => {
    if (treeViewType !== TreeViewType.assets) {
      return
    }
    this.setup()
  }

  get allProjects(): FXGProject[] {
    const projectList: FXGProject[] = [
      WorkspaceManager.getInstance().mainProject,
      ...WorkspaceManager.getInstance().subProjectList,
    ]
    return projectList
  }

  // MARK: - setup
  setupRefreshCallback() {
    for (const proj of this.allProjects) {
      proj.addTreeViewRefreshCallback(this.refreshCallback)
    }
  }

  async setup() {
    this.treeNodes = []

    // 当前项目
    for (const proj of this.allProjects) {
      if (proj.assetNodes.length === 0) {
        continue
      }
      const node = await this.assembleProjectTreeNode(proj)
      this.treeNodes.push(node)
    }
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
  private async assembleProjectTreeNode(project: FXGProject): Promise<AssetsTreeNode | null> {
    const projectDir: string = project.dir
    const projectName: string = project.projectName

    // 配置
    const previewNode: AssetsTreeNode = this.assembleDirTreeNode_Configs(projectDir, projectName)

    // assets node
    const assetsNode: AssetsTreeNode = this.assembleDirTreeNode_Assets(project)

    // 生成文件 node
    const generatedNode: AssetsTreeNode = await this.assembleDirTreeNode_Generated(projectDir, projectName)

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

  private assembleDirTreeNode_Configs(projectDir: string, projectName: string): AssetsTreeNode {
    const node: AssetsTreeNode = new AssetsTreeNode(
      "生成器配置",
      vscode.TreeItemCollapsibleState.None,

      TreeNodeType.preview,
      projectDir,
      projectName,
      [],
      "",
      Object.assign(
        {},
        getFXGCommandData(FXGCommandType.openFXGUIWeb),
        {
          arguments: [
            {
              timestamp: Date.now(),
              eventType: InteractionEventType.extToWeb_preview_assets,
              projectInfo: {
                name: projectName,
                dir: projectDir,
              },
              data: null
            }
          ]
        }
      ),

      true,
    )
    return node
  }

  private assembleDirTreeNode_Assets(project: FXGProject): AssetsTreeNode {
    const relativePath = `assets` // TODO: 根据配置读取
    const dir = `${project.dir}/${relativePath}`

    const node: AssetsTreeNode = new AssetsTreeNode(
      "assets",
      vscode.TreeItemCollapsibleState.Collapsed,

      TreeNodeType.folder,
      dir,
      project.projectName,
      project.assetNodes,
      "",
      null,

      true,
    )
    return node
  }

  private async assembleDirTreeNode_Generated(projectDir: string, projectName: string,): Promise<AssetsTreeNode | null> {
    const fileRelativePath = `lib/generated/assets.dart` // TODO: 根据配置读取
    let fileNode: AssetsTreeNode = await this.assembleAssetsTreeNode(
      projectDir,
      projectName,
      `${projectDir}/${fileRelativePath}`,
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

  private async assembleAssetsTreeNode(
    projectDir: string,
    projectName: string,
    itemPath: string,
    validAssetsRelativePaths: string[],
  ): Promise<AssetsTreeNode> {
    let rootNode: AssetsTreeNode | null = null
    try {
      let itemName = FileUtil.getFileName(itemPath)
      let itemRelativePath: string = itemPath.replaceAll(`${projectDir}/`, "")
      let isDir: boolean = await FileUtil.pathIsDir(itemPath)
      let validPath: boolean = true
      let subTreeNodes: AssetsTreeNode[] = []
      if (isDir) {
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
      if (!isDir) {
        command = await this.getTreeNodeCommand(projectDir, projectName, itemPath)
      }

      subTreeNodes = TreeViewUtil.sortTreeNodeList<AssetsTreeNode>(subTreeNodes) // 排序
      rootNode = new AssetsTreeNode(
        itemName,
        isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,

        isDir ? TreeNodeType.folder : TreeNodeType.file,
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
      const event: InteractionEvent = {
        timestamp: Date.now(),
        eventType: InteractionEventType.extToWeb_preview_assets,
        projectInfo: {
          name: projectName,
          dir: projectDir,
        },
        data: filePath
      }
      resultCommand = Object.assign(
        {},
        getFXGCommandData(FXGCommandType.openFXGUIWeb),
        {
          arguments: [
            event,
          ]
        }
      )
    }
    return Promise.resolve(resultCommand)
  }
}
