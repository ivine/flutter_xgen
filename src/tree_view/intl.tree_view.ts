import * as vscode from 'vscode'

import FXGProject, { TreeViewRefreshCallback } from '../model/project'
import { FileUtil } from '../util/file.util'

import WorkspaceManager from '../manager/workspace.manager'
import { TreeViewType } from '../manager/tree_view.manager'
import { InteractionEvent, InteractionEventType } from '../manager/interaction.manager'
import { FXGCommandData, FXGCommandType, getFXGCommandData } from '../manager/command.manager'

import TreeViewUtil from './tree_view.util'
import { IntlTreeNode, TreeNodeType } from './tree_node'

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

    this.setupRefreshCallback()
    this.setup()
  }

  refreshCallback: TreeViewRefreshCallback = (treeViewType: TreeViewType) => {
    if (treeViewType !== TreeViewType.localizations) {
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
      if (proj.l10nNodes.length === 0) {
        continue
      }
      const node = await this.assembleProjectTreeNode(proj)
      this.treeNodes.push(node)
    }
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
  private async assembleProjectTreeNode(project: FXGProject): Promise<IntlTreeNode | null> {
    // preview node
    const previewNode: IntlTreeNode = this.assembleDirTreeNode_Configs(project)

    // assets node
    const assetsNode = this.assembleDirTreeNode_l10n(project)

    // 生成文件 node
    const generatedNode = this.assembleDirTreeNode_Generated(project)

    // 最后的树
    let treeNode: IntlTreeNode = new IntlTreeNode(
      project.projectName,
      vscode.TreeItemCollapsibleState.Expanded,

      TreeNodeType.folder,
      project.dir,
      project.projectName,
      [previewNode, generatedNode, assetsNode],
      "",
      null,
    )
    return Promise.resolve(treeNode)
  }

  private assembleDirTreeNode_Configs(project: FXGProject): IntlTreeNode {
    const node = new IntlTreeNode(
      "生成器配置",
      vscode.TreeItemCollapsibleState.None,

      TreeNodeType.preview,
      project.dir,
      project.projectName,
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
                dir: project.dir,
                name: project.projectName,
              },
              data: null
            }
          ]
        }
      ),
    )
    return node
  }

  private assembleDirTreeNode_Generated(project: FXGProject): IntlTreeNode {
    const projectDir = project.dir
    const projectName = project.projectName

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

  private assembleDirTreeNode_l10n(project: FXGProject): IntlTreeNode {
    const projectDir = project.dir
    const projectName = project.projectName

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
}
