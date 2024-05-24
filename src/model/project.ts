import * as vscode from 'vscode'
const yaml = require('js-yaml');

import { IntlArbFile } from '../model/intl'
import { FileUtil } from '../util/file.util'
import TreeViewUtil from '../tree_view/tree_view.util';
import { AssetsTreeNode, IntlTreeNode, TreeNodeType } from '../tree_view/tree_node';

import { TreeViewType } from '../manager/tree_view.manager';
import { InteractionEventType } from '../manager/interaction.manager';
import WatcherManager, { FileWatcher, WatcherEventType, WatcherType } from '../manager/watcher.manager';

import { PreviewItem } from './preview';

export default class FXGProject {
  dir: string
  isMain: boolean
  constructor(dir: string, isMain: boolean) {
    this.dir = dir
    this.isMain = isMain
    this.setup()
  }

  loading: boolean = false
  pubspecData: any = null

  assetsDirPath: string = ""
  l10nsDirPath: string = ""

  assetsDirWatcher: FileWatcher | null = null
  l10nsDirWatcher: FileWatcher | null = null

  refreshTreeViewCallback: (treeViewType: TreeViewType) => void | null = null

  assetNodes: AssetsTreeNode[] = []
  l10nNodes: IntlTreeNode[] = []
  intlFiles: IntlArbFile[] = []

  assetOneDimensionalPreviewNodes: AssetsTreeNode[] = [] // TODO: 预览全部

  public async setup() {
    // 获取当前 pubspec data
    this.loading = true
    try {
      await this.getCurrentPubspecData()
      this.addWatchers()
      this.getCurrentAssetsFileTree()
      this.getCurrentLocalizationFileTree()
    } catch (error) {
      console.log("FXGProject - setup, error:", error)
    }
    this.loading = false
  }

  public addWatchers() {
    // assets watcher
    this.assetsDirWatcher = WatcherManager.getInstance().createWatch(WatcherType.assets, this.dir, this.assetsDirPath, (eventType, uri) => {
      if (eventType === WatcherEventType.onChanged) {
        return
      }
      this.getCurrentAssetsFileTree()
    })
    this.l10nsDirWatcher = WatcherManager.getInstance().createWatch(WatcherType.intl, this.dir, this.l10nsDirPath, (eventType, uri) => {
      if (eventType === WatcherEventType.onChanged) {
        return
      }
      this.getCurrentLocalizationFileTree()
    })
  }

  public dispose() {
    this.assetNodes = []
    this.assetOneDimensionalPreviewNodes = []
    this.l10nNodes = []
    this.intlFiles = []
    this.refreshTreeViewCallback = null

    WatcherManager.getInstance().stopWatch(this.assetsDirWatcher)
    WatcherManager.getInstance().stopWatch(this.l10nsDirWatcher)
  }

  public refresh() { }

  // MARK: - Getter & Setter
  get projectName(): string {
    let result: string = ""
    try {
      result = this.pubspecData["name"]
    } catch (error) {

    }
    return result
  }

  // MARK: - Private
  private async getCurrentPubspecData() {
    let pubspecPath = `${this.dir}/pubspec.yaml`
    if (!FileUtil.pathExists(pubspecPath)) {
      console.log("pubspec no exist, TODO: add alert");
      return;
    }
    let result: string = await FileUtil.readFile(pubspecPath)
    this.pubspecData = yaml.load(result)

    // 根据项目配置来确定路径
    this.assetsDirPath = `${this.dir}/assets`
    this.l10nsDirPath = `${this.dir}/lib/l10n`
  }

  private async getCurrentAssetsFileTree() {
    let pathsSettings = this.pubspecData["flutter"]["assets"]
    if (!Array.isArray(pathsSettings)) {
      console.log('getCurrentAssetsFileTree, assetsSettings is not array')
      return;
    }

    let nodes: AssetsTreeNode[] = []

    for (let p of pathsSettings) {
      let fullPath = this.dir + "/" + p
      let isDir = await FileUtil.pathIsDir(fullPath)
      let subNodes: AssetsTreeNode[] = []
      let command: vscode.Command | null = null
      if (isDir) {
        subNodes = await this.assembleAssetsFiles(fullPath)
      } else {
        command = await TreeViewUtil.getTreeNodeCommand(this.dir, this.projectName, fullPath, InteractionEventType.extToWeb_preview_assets)
      }
      let node = new AssetsTreeNode(
        FileUtil.getFileName(fullPath),
        isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,

        isDir ? TreeNodeType.folder : TreeNodeType.file,
        this.dir,
        this.projectName,
        subNodes,
        fullPath,
        command,

        true,
      )
      nodes.push(node)
    }
    this.assetNodes = nodes

    // 通知
    if (typeof this.refreshTreeViewCallback === 'function') {
      this.refreshTreeViewCallback(TreeViewType.assets)
    }

    // 生成一维数组
    this.assetOneDimensionalPreviewNodes = this.getOneDimensionalPreviewNodes(nodes)

    // FlutterAssetsGenerator generate ruler: https://github.com/cr1992/FlutterAssetsGenerator

    // FlutterGen generate ruler: https://github.com/FlutterGen/flutter_gen
  }

  private async assembleAssetsFiles(dir: string): Promise<AssetsTreeNode[]> {
    let nodes: AssetsTreeNode[] = []
    let isValid = true

    let allFiles: string[] = FileUtil.getDirAllFiles(dir)
    allFiles = FileUtil.sortFiles(allFiles)
    for (let fullPath of allFiles) {
      let subNodes: AssetsTreeNode[] = []
      let command: vscode.Command | null = null
      let isDir = await FileUtil.pathIsDir(fullPath)
      if (isDir) {
        subNodes = await this.assembleAssetsFiles(fullPath)
      } else {
        command = await TreeViewUtil.getTreeNodeCommand(this.dir, this.projectName, fullPath, InteractionEventType.extToWeb_preview_assets)
      }
      let node = new AssetsTreeNode(
        FileUtil.getFileName(fullPath),
        isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,

        isDir ? TreeNodeType.folder : TreeNodeType.file,
        this.dir,
        this.projectName,
        subNodes,
        fullPath,
        command,

        true,
      )
      nodes.push(node)
    }
    return Promise.resolve(nodes)
  }

  private getOneDimensionalPreviewNodes(nodes: AssetsTreeNode[]): AssetsTreeNode[] {
    let res: AssetsTreeNode[] = []
    for (let item of nodes) {
      if (item.nodeType === TreeNodeType.file) {
        const path = item.nodeAbsolutePath
        const vscodePreview = FileUtil.isFileSuitableForTextDocument(path)
        if (vscodePreview) {
          continue
        }
        res.push(item)
      } else if (item.nodeType === TreeNodeType.folder) {
        res = [...res, ...this.getOneDimensionalPreviewNodes(item.subTreeNodes)]
      }
    }
    return res
  }

  private async getCurrentLocalizationFileTree() {
    // flutter_intl
    let pathsSettings = this.pubspecData["flutter_intl"]
    if (!pathsSettings) {
      console.log('getCurrentLocalizationFileTree, assetsSettings is not array')
      return;
    }

    let l10nFilesDir: string = `${this.dir}/lib/l10n`
    let configL10nFilesDir: any = pathsSettings["arb-dir"]
    if (typeof configL10nFilesDir === "string" && configL10nFilesDir.length > 0) {
      l10nFilesDir = `${this.dir}/${configL10nFilesDir}`
    }

    let nodes: AssetsTreeNode[] = []
    let allFiles: string[] = FileUtil.getDirAllFiles(l10nFilesDir)
    allFiles = FileUtil.sortFiles(allFiles)
    for (let fullPath of allFiles) {
      let subNodes: IntlTreeNode[] = []
      let command: vscode.Command | null = null
      let isDir = await FileUtil.pathIsDir(fullPath)
      if (isDir) {
        subNodes = await this.assembleAssetsFiles(fullPath)
      } else {
        command = await TreeViewUtil.getTreeNodeCommand(this.dir, this.projectName, fullPath, InteractionEventType.extToWeb_preview_assets)
      }
      let node = new AssetsTreeNode(
        FileUtil.getFileName(fullPath),
        isDir ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,

        isDir ? TreeNodeType.folder : TreeNodeType.file,
        this.dir,
        this.projectName,
        [],
        fullPath,
        command,

        true,
      )
      nodes.push(node)
    }

    this.l10nNodes = nodes

    // 通知
    if (typeof this.refreshTreeViewCallback === 'function') {
      this.refreshTreeViewCallback(TreeViewType.localizations)
    }
  }

  public getPreviewItem(selectedItem: string | null, previous: boolean, next: boolean): PreviewItem {
    let path = selectedItem
    if (!(typeof path === 'string' && path.length > 0)) {
      path = this.assetOneDimensionalPreviewNodes[0].nodeAbsolutePath
    }

    if (previous) {
      let index = this.assetOneDimensionalPreviewNodes.findIndex(e => e.nodeAbsolutePath === path)
      index = Math.min(Math.max(0, index - 1), this.assetOneDimensionalPreviewNodes.length - 1)
      path = this.assetOneDimensionalPreviewNodes[index].nodeAbsolutePath
    } else if (next) {
      let index = this.assetOneDimensionalPreviewNodes.findIndex(e => e.nodeAbsolutePath === path)
      index = Math.min(Math.max(0, index + 1), this.assetOneDimensionalPreviewNodes.length - 1)
      path = this.assetOneDimensionalPreviewNodes[index].nodeAbsolutePath
    }

    let result: PreviewItem = new PreviewItem(path)
    return result
  }
}
