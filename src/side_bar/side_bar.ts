import * as vscode from 'vscode';
const path = require('path');

export class SideBar implements vscode.TreeDataProvider<SideBarItem> {
  public id: string;
  public rootSideBars: SideBarItem[] = [];
  public context?: vscode.ExtensionContext;

  constructor(id: string, context?: vscode.ExtensionContext, rootSideBars?: SideBarItem[]) {
    this.id = id,
    this.context = context;
    this.rootSideBars = rootSideBars || [];
    this.context = context;
  }

  getTreeItem(element: SideBarItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: SideBarItem
  ): vscode.ProviderResult<SideBarItem[]> {
    var childrenList: any = [];
    console.log(`dw test, this.id --> ${this.id}`);
    if (this.id === 'FXG-l10n') {
      childrenList = [
        new SideBarItem("1", vscode.TreeItemCollapsibleState.None),
        new SideBarItem("2", vscode.TreeItemCollapsibleState.None),
        new SideBarItem("3", vscode.TreeItemCollapsibleState.None),
        new SideBarItem("4", vscode.TreeItemCollapsibleState.None),
      ];
    } else {
      childrenList = [
        new SideBarItem("a", vscode.TreeItemCollapsibleState.None),
        new SideBarItem("b", vscode.TreeItemCollapsibleState.None),
        new SideBarItem("c", vscode.TreeItemCollapsibleState.None),
        new SideBarItem("d", vscode.TreeItemCollapsibleState.None),
      ];
    }
    //子节点
    // commands?.forEach((item: any, index: number) => {
    //   const children = new SideBarItem(
    //     item.title,
    //     vscode.TreeItemCollapsibleState.None,
    //     item.hotKey,
    //     item.icon,
    //   );
    //   children.command = {
    //     command: item.command,
    //     title: '',
    //     arguments: [], //命令接收的参数
    //   };
    //   childrenList[index] = children;
    // });
    return childrenList;
  }
}

/**
 * @description 重写侧边栏入口子节点
 */
export class SideBarItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    private icon?: string,
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`; // 鼠标悬停时的提示
    this.iconPath = this.icon ? path.join(__dirname, "../../", "images", this.icon) : '';
  }
}