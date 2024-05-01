import * as vscode from 'vscode'
import { IntlTreeView } from '../tree_view/intl.tree_view';
import { AssetsTreeView } from '../tree_view/assets.tree_view';

enum TreeViewType {
  assets,
  intl,
}

class TreeViewUtil {
  public static getDisplayName(type: TreeViewType): string {
    let result = ""
    switch (type) {
      case TreeViewType.assets:
        result = "Assets"
        break;

      case TreeViewType.intl:
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

      case TreeViewType.intl:
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
  private l10nFilePaths: string[] = []
  private assetsDirs: string[] = []
  private treeViewTypes: TreeViewType[] = [TreeViewType.assets, TreeViewType.intl]
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
      if (t == TreeViewType.intl) {
        vscode.window.registerTreeDataProvider(id, new IntlTreeView(id, this.rootPath, []))
      } else if (t == TreeViewType.assets) {
        vscode.window.registerTreeDataProvider(id, new AssetsTreeView(id, this.rootPath, []))
      }
    }
  }
}