import * as vscode from 'vscode'
import { IntlTreeView } from '../tree_view/intl.tree_view';
import { AssetsTreeView } from '../tree_view/assets.tree_view';
import { TreeNode } from '../tree_view/tree_node';

export enum TreeViewType {
  assets,
  localizations,
}

class TreeViewUtil {
  public static getDisplayName(type: TreeViewType): string {
    let result = ""
    switch (type) {
      case TreeViewType.assets:
        result = "Assets"
        break;

      case TreeViewType.localizations:
        result = "Localizations"
        break;

      default:
        break;
    }
    return result
  }

  public static getTreeViewId(type: TreeViewType): string {
    let result = ""
    switch (type) {
      case TreeViewType.assets:
        result = "FXG_Assets"
        break;

      case TreeViewType.localizations:
        result = "FXG_Intl"
        break;

      default:
        break;
    }
    return result
  }
}

export default class TreeViewManager {
  private static instance: TreeViewManager | null = null
  private rootPath: string = ""
  private treeViewTypes: TreeViewType[] = [TreeViewType.assets, TreeViewType.localizations]
  public treeViews: vscode.TreeDataProvider<TreeNode>[] = []
  private constructor() { }
  static getInstance(): TreeViewManager {
    if (!TreeViewManager.instance) {
      TreeViewManager.instance = new TreeViewManager()
    }
    return TreeViewManager.instance
  }

  public setup(rootPath: string) {
    this.rootPath = rootPath
    this.registerTreeDataProvider()
  }

  private registerTreeDataProvider() {
    for (let t of this.treeViewTypes) {
      let id: string = TreeViewUtil.getTreeViewId(t)
      if (t == TreeViewType.localizations) {
        const treeView = new IntlTreeView(id, this.rootPath, [])
        vscode.window.registerTreeDataProvider(id, treeView)
        this.treeViews.push(treeView)
      } else if (t == TreeViewType.assets) {
        const treeView = new AssetsTreeView(id, this.rootPath, [])
        vscode.window.registerTreeDataProvider(id, treeView)
        this.treeViews.push(treeView)
      }
    }
  }
}