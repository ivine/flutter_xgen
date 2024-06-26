import * as vscode from 'vscode'

export enum TreeNodeType {
  file,
  folder,
  preview,
  configs
}

export class TreeNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,

    // 自定义
    public readonly nodeType: TreeNodeType,
    public readonly projectDir: string,
    public readonly projectName: string,
    public readonly subTreeNodes: TreeNode[],
    public readonly nodeAbsolutePath: string,
    public readonly command: vscode.Command | null = null
  ) {
    super(label, collapsibleState)
  }
}

export class AssetsTreeNode extends TreeNode {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,

    public readonly nodeType: TreeNodeType,
    public readonly projectDir: string,
    public readonly projectName: string,
    public readonly subTreeNodes: AssetsTreeNode[],
    public readonly nodeAbsolutePath: string,
    public readonly command: vscode.Command | null = null,

    // 自定义
    public readonly validFile: boolean // true: 存在于 pubspec.yaml - flutter - assets 配置中的
  ) {
    super(label, collapsibleState, nodeType, projectDir, projectName, subTreeNodes, nodeAbsolutePath, command)

    if (nodeType === TreeNodeType.folder) {
      this.iconPath = ''
      this.description = validFile ? '' : '  路径无效' // 添加操作事件
    } else if (nodeType === TreeNodeType.file) {
      this.iconPath = new vscode.ThemeIcon('file')
      // this.description = validFile ? "" : "  文件无效"
    }
  }
}

export class IntlTreeNode extends TreeNode {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,

    public readonly nodeType: TreeNodeType,
    public readonly projectDir: string,
    public readonly projectName: string,
    public readonly subTreeNodes: IntlTreeNode[],
    public readonly nodeAbsolutePath: string,
    public readonly command: vscode.Command | null = null

    // 自定义
  ) {
    super(label, collapsibleState, nodeType, projectDir, projectName, subTreeNodes, nodeAbsolutePath, command)
  }
}
