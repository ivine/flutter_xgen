import * as vscode from 'vscode'

import { FileUtil } from '../util/file.util'
import { FXGCommandType } from '../manager/command.manager'

import { IntlTreeNode, IntlTreeNodeType, TreeNodeType } from './tree_node'
import TreeViewUtil from './tree_view.util'

export class IntlTreeView implements vscode.TreeDataProvider<IntlTreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<IntlTreeNode | undefined | null | void> = new vscode.EventEmitter<IntlTreeNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<IntlTreeNode | undefined | null | void> = this._onDidChangeTreeData.event;

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
    let rootProjectNode: IntlTreeNode = await this.assembleTreeNode(this.rootPath)
    this.treeNodes.push(rootProjectNode)

    // 其他子项目
    for (let p of this.workspaceDirs) {
      if (p === this.rootPath) {
        continue;
      }
      let subProjectNodes: IntlTreeNode = await this.assembleTreeNode(this.rootPath)
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
      vscode.window.showInformationMessage('打开文件夹')
      return Promise.resolve([])
    }
    if (this.treeNodes.length === 0) {
      console.log("intl.tree_view, treeNodes is empty")
      return Promise.resolve([])
    }
    if (element && element !== undefined && element.intlTreeNodeType === IntlTreeNodeType.project) {
      // current element is branch, return leafs
      return Promise.resolve(element.subTreeNodes)
    } else {
      // root
      return Promise.resolve(this.treeNodes)
    }
  }

  private async assembleTreeNode(projectDir: string): Promise<IntlTreeNode> {
    let projectTreeNode: IntlTreeNode | null = null
    try {
      let rootArbFilePaths: string[] = FileUtil.getProjectAllArbFiles(projectDir)
      let pubspecData: any = await FileUtil.readYamlFile(`${projectDir}/pubspec.yaml`)
      let projectName: string = pubspecData["name"]

      // child tree items
      let subtreeNodes: IntlTreeNode[] = []

      // arb file json
      let allArbJsonNode: IntlTreeNode = new IntlTreeNode(
        "all_arb.json",
        vscode.TreeItemCollapsibleState.None,

        TreeNodeType.file,
        projectDir,
        projectName,
        [],
        "",
        {
          title: FXGCommandType.openFXGUIWeb,
          command: FXGCommandType.openFXGUIWeb,
          arguments: [rootArbFilePaths],
        },

        IntlTreeNodeType.allJson
      );
      subtreeNodes.push(allArbJsonNode)

      // arb file
      for (let p of rootArbFilePaths) {
        let fileName = FileUtil.getFileNameWithExtension(p)
        let arbFileNode: IntlTreeNode = new IntlTreeNode(
          fileName,
          vscode.TreeItemCollapsibleState.None,

          TreeNodeType.file,
          projectDir,
          projectName,
          [],
          "",
          {
            title: FXGCommandType.openFile,
            command: FXGCommandType.openFile,
            arguments: [p],
          },

          IntlTreeNodeType.arbFile,
        );
        subtreeNodes.push(arbFileNode)
      }

      // project folder
      projectTreeNode = new IntlTreeNode(
        projectName,
        vscode.TreeItemCollapsibleState.Expanded,

        TreeNodeType.folder,
        projectDir,
        projectName,
        subtreeNodes,
        "",
        null,

        IntlTreeNodeType.project,
      );
    } catch (error) {
      console.log("assembleTreeNode, error: ", error)
    }

    return Promise.resolve(projectTreeNode)
  }
}
