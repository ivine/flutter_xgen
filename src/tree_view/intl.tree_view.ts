import * as vscode from 'vscode'

import { FileUtil } from '../util/file.util'
import { FXGCommandType, getFXGCommandData } from '../manager/command.manager'

import { IntlTreeNode, TreeNodeType } from './tree_node'
import TreeViewUtil from './tree_view.util'
import { InteractionEventType } from '../manager/interaction.manager'

export class IntlTreeView implements vscode.TreeDataProvider<IntlTreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<IntlTreeNode | undefined | null | void> = new vscode.EventEmitter<IntlTreeNode | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<IntlTreeNode | undefined | null | void> = this._onDidChangeTreeData.event

  public id: string
  public rootPath: string
  public workspaceDirs: string[]

  public treeNodes: IntlTreeNode[] = []
  constructor(id: string, rootPath: string, workspaceDirs: string[]) {
    this.id = id
    this.rootPath = rootPath
    this.workspaceDirs = workspaceDirs

    this.setup()
  }

  async setup() {
    this.treeNodes = []

    // 当前项目
    let rootProjectNode: IntlTreeNode = await this.assembleProjectTreeItem(this.rootPath)
    this.treeNodes.push(rootProjectNode)

    // 其他子项目
    for (let p of this.workspaceDirs) {
      if (p === this.rootPath) {
        continue
      }
      let subProjectNodes: IntlTreeNode = await this.assembleProjectTreeItem(this.rootPath)
      this.treeNodes.push(subProjectNodes)
    }

    // refresh
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: IntlTreeNode): vscode.TreeItem {
    return element
  }

  getChildren(element?: IntlTreeNode): Thenable<IntlTreeNode[]> {
    if (this.rootPath.length === 0) {
      return Promise.resolve([])
    }
    if (this.treeNodes.length === 0) {
      console.log("intl.tree_view, treeNodes is empty")
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

  // MARK: - assemble

  private async assembleFileDirTreeNode(projectDir: string, projectName: string): Promise<IntlTreeNode | null> {
    // let validAssetsRelativePaths: string[] = pubspecData["flutter"]["assets"] // TODO: 待开发
    const assetsDir = `${projectDir}/lib/l10n` // TODO: 路径应该也要读取

    let subNodes: IntlTreeNode[] = []
    if (FileUtil.pathExists(assetsDir)) {
      const filePaths: string[] = FileUtil.getDirAllFiles(assetsDir) // 全部文件
      for (const path of filePaths) {
        if (!path.endsWith(".arb")) {
          continue
        }
        const node: IntlTreeNode | null = new IntlTreeNode(
          FileUtil.getFileName(path),
          vscode.TreeItemCollapsibleState.None,

          TreeNodeType.file,
          projectDir,
          projectName,
          [],
          "",
          {
            title: FXGCommandType.openFile,
            command: FXGCommandType.openFile,
            arguments: [path],
          },
        )
        subNodes.push(node)
      }
      subNodes = TreeViewUtil.sortTreeNodeList<IntlTreeNode>(subNodes) // 排序
    } else {
      console.log(`assembleProjectTreeItem, rootAssetsPath: ${assetsDir} is not exist`)
    }

    const node: IntlTreeNode = new IntlTreeNode(
      "l10n",
      vscode.TreeItemCollapsibleState.Collapsed,

      TreeNodeType.folder,
      projectDir,
      projectName,
      subNodes,
      "",
      null,
    )
    return node
  }

  // TODO: 看一下要不要做成动态的
  private async assembleGeneratedDirTreeNode(projectDir: string, projectName: string,): Promise<IntlTreeNode | null> {
    let l10nNode: IntlTreeNode = new IntlTreeNode(
      "l10n.dart",
      vscode.TreeItemCollapsibleState.None,

      TreeNodeType.file,
      projectDir,
      projectName,
      [],
      `${projectDir}/lib/generated/l10n.dart`,
      {
        title: FXGCommandType.openFile,
        command: FXGCommandType.openFile,
        arguments: [`${projectDir}/lib/generated/l10n.dart`],
      },
    )

    // intl node
    let subNodes: IntlTreeNode[] = []
    const generatedIntlDir = `${projectDir}/lib/generated/intl`
    if (FileUtil.pathExists(generatedIntlDir)) {
      const filePaths: string[] = FileUtil.getDirAllFiles(generatedIntlDir) // 全部文件
      for (const path of filePaths) {
        if (!path.endsWith(".dart")) {
          continue
        }
        const node: IntlTreeNode | null = new IntlTreeNode(
          FileUtil.getFileName(path),
          vscode.TreeItemCollapsibleState.None,

          TreeNodeType.file,
          projectDir,
          projectName,
          [],
          "",
          {
            title: FXGCommandType.openFile,
            command: FXGCommandType.openFile,
            arguments: [path],
          },
        )
        subNodes.push(node)
      }
      subNodes = TreeViewUtil.sortTreeNodeList<IntlTreeNode>(subNodes) // 排序
    } else {
      console.log(`assembleGeneratedDirTreeNode, generatedIntlDir: ${generatedIntlDir} is not exist`)
    }
    const intlNode: IntlTreeNode = new IntlTreeNode(
      "intl",
      vscode.TreeItemCollapsibleState.Expanded,

      TreeNodeType.folder,
      projectDir,
      projectName,
      subNodes,
      "",
      null,
    )

    // root node
    let node: IntlTreeNode = new IntlTreeNode(
      "generated",
      vscode.TreeItemCollapsibleState.Collapsed,

      TreeNodeType.folder,
      projectDir,
      projectName,
      [l10nNode, intlNode],
      "",
      null,
    )
    return node
  }

  private async assembleProjectTreeItem(projectDir: string): Promise<IntlTreeNode | null> {
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
    const previewNode: IntlTreeNode = new IntlTreeNode(
      "预览",
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
              eventType: InteractionEventType.extToWeb_preview_localization,
              projectInfo: {
                name: projectName,
                dir: projectDir,
              },
              data: null
            }
          ]
        }
      ),
    )

    // assets node
    const assetsNode = await this.assembleFileDirTreeNode(projectDir, projectName)

    // 生成文件 node
    const generatedNode = await this.assembleGeneratedDirTreeNode(projectDir, projectName)

    // 最后的树
    let treeNode: IntlTreeNode = new IntlTreeNode(
      projectName,
      vscode.TreeItemCollapsibleState.Expanded,

      TreeNodeType.folder,
      projectDir,
      projectName,
      [previewNode, generatedNode, assetsNode],
      "",
      null,
    )
    return Promise.resolve(treeNode)
  }
}
