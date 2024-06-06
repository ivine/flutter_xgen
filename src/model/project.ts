import * as vscode from 'vscode'
import _ from 'lodash'
const fs = require('fs')
const p = require('path')
import YAML, { Document, YAMLMap, YAMLSeq } from 'yaml'

import { FileUtil } from '../util/file.util'
import TreeViewUtil from '../tree_view/tree_view.util'
import { AssetsTreeNode, IntlTreeNode, TreeNodeType } from '../tree_view/tree_node'

import { TreeViewType } from '../manager/tree_view.manager'
import WatcherManager, { FileWatcher, WatcherEventType } from '../manager/watcher.manager'

import { PreviewItem } from './preview'
import { FlutterAssetsGeneratorConfigByCr1992, FlutterGenConfig, FlutterIntlConfig } from './project.enum'
import { FXGWatcherType, FlutterAssetsConfigType, InteractionEvent, InteractionEventType, ProjectInfoMsgInterface } from '../webview/const'
import AssetsGenerator from '../generator/assets/assets.generator'
import { FXGUIWebPanel } from '../webview/fxg_web_panel'
import StoreManager from '../manager/store.manager'

export type TreeViewRefreshCallback = (treeViewType: TreeViewType) => void

export default class FXGProject {
  dir: string
  isMain: boolean
  constructor(dir: string, isMain: boolean) {
    this.dir = dir
    this.isMain = isMain
    this.setup()
  }

  loading: boolean = false
  pubspecDoc: Document = null

  assetsDirPath: string = ""
  l10nsDirPath: string = ""

  watcherTypes: FXGWatcherType[] = []
  assetsDirWatcher: FileWatcher | null = null
  l10nsDirWatcher: FileWatcher | null = null
  assetsDirWatchEventDebounce: (eventType: WatcherEventType, uri: vscode.Uri) => void
  l10nDirWatchEventDebounce: (eventType: WatcherEventType, uri: vscode.Uri) => void

  refreshTreeViewCallbackList: TreeViewRefreshCallback[] = []

  assetNodes: AssetsTreeNode[] = []
  l10nNodes: IntlTreeNode[] = []

  flutterIntlConfig: FlutterIntlConfig | null = null
  flutterGenConfig: FlutterGenConfig | null = null
  flutterAssetsGeneratorConfigByCr1992: FlutterAssetsGeneratorConfigByCr1992 | null = null

  assetOneDimensionalPreviewNodes: AssetsTreeNode[] = [] // TODO: 预览全部

  public async setup() {
    // 获取当前 pubspec data
    this.loading = true
    try {
      await this.getCurrentPubspecDoc()
      this.getCurrentAssetsFileTree()
      this.getCurrentLocalizationFileTree()
      this.addWatchers()
      this.setupWatchersDebounce()
    } catch (error) {
      console.log("FXGProject - setup, error:", error)
    }
    this.loading = false
  }

  public addWatchers() {
    // 因为树也需要更新
    this.assetsDirWatcher = WatcherManager.getInstance().createWatch(this.dir, this.assetsDirPath, (eventType, uri) => {
      this.assetsDirWatchEventDebounce(eventType, uri)
      if (eventType === WatcherEventType.onChanged) {
        return
      }
      this.getCurrentAssetsFileTree()
    })
    this.l10nsDirWatcher = WatcherManager.getInstance().createWatch(this.dir, this.l10nsDirPath, (eventType, uri) => {
      this.l10nDirWatchEventDebounce(eventType, uri)
      if (eventType === WatcherEventType.onChanged) {
        return
      }
      this.getCurrentLocalizationFileTree()
    })
  }

  public setupWatchersDebounce() {
    this.assetsDirWatchEventDebounce = _.debounce((eventType: WatcherEventType, uri: vscode.Uri) => {
      this.setWatcherCallback(uri, eventType, FXGWatcherType.assets_cr1992)
      this.setWatcherCallback(uri, eventType, FXGWatcherType.assets_flutter_gen)
    }, 300)
    this.l10nDirWatchEventDebounce = _.debounce((eventType: WatcherEventType, uri: vscode.Uri) => {
      this.setWatcherCallback(uri, eventType, FXGWatcherType.l10n)
    }, 300)
  }

  public setWatcherCallback(uri: vscode.Uri, eventType: WatcherEventType, watcherType: FXGWatcherType) {
    const enable = StoreManager.getInstance().getWatcherEnable(this.dir, watcherType)
    if (!enable) {
      return
    }
    const projectInfo: ProjectInfoMsgInterface = {
      name: this.projectName,
      dir: this.dir,
      watcherTypes: this.watcherTypes,
    }
    switch (watcherType) {
      case FXGWatcherType.assets_cr1992: {
        if (eventType === WatcherEventType.onChanged || this.flutterAssetsGeneratorConfigByCr1992 === null) {
          return
        }
        AssetsGenerator.getInstance().runCr1992Generator(projectInfo, this.flutterAssetsGeneratorConfigByCr1992)
      }
        break;

      case FXGWatcherType.assets_flutter_gen:

        break;

      case FXGWatcherType.l10n:

        break;
      default:
        break;
    }
  }

  public setWatcherEnable(enable: boolean, type: FXGWatcherType) {
    StoreManager.getInstance().setWatcherEnable(enable, this.dir, type)
  }

  public dispose() {
    this.assetNodes = []
    this.assetOneDimensionalPreviewNodes = []
    this.l10nNodes = []
    this.refreshTreeViewCallbackList = []

    WatcherManager.getInstance().stopWatch(this.assetsDirWatcher)
    WatcherManager.getInstance().stopWatch(this.l10nsDirWatcher)
  }

  public async refresh() {
    await this.getCurrentPubspecDoc()
    const projectInfo: ProjectInfoMsgInterface = {
      name: this.projectName,
      dir: this.dir,
      watcherTypes: this.watcherTypes
    }
    const event: InteractionEvent = {
      timestamp: Date.now(),
      eventType: InteractionEventType.extToWeb_configs_assets,
      projectInfo: projectInfo,
      data: null
    }
    FXGUIWebPanel.currentPanel.postMsg(event, true)
  }

  public saveCurrentPubspec() {
    const pubspecPath: string = `${this.dir}/pubspec.yaml`
    if (fs.existsSync(pubspecPath)) {
      fs.writeFileSync(pubspecPath, '')
    } else {
      // 确保目录存在，如果不存在则递归创建
      fs.mkdirSync(p.dirname(pubspecPath), { recursive: true })
    }
    const content = YAML.stringify(this.pubspecDoc)
    fs.writeFileSync(pubspecPath, content)
  }

  // MARK: - Getter & Setter
  get projectName(): string {
    let result: string = ""
    try {
      result = this.pubspecDoc.get('name') as string
    } catch (error) {

    }
    return result
  }

  // MARK: - Private
  private async getCurrentPubspecDoc() {
    let pubspecPath = `${this.dir}/pubspec.yaml`
    if (!FileUtil.pathExists(pubspecPath)) {
      console.log("pubspec no exist, TODO: add alert")
      return
    }
    this.pubspecDoc = await FileUtil.readYamlFile(pubspecPath)

    // TODO: 根据项目配置来确定路径
    this.assetsDirPath = `${this.dir}/assets`
    this.l10nsDirPath = `${this.dir}/lib/l10n`

    // flutter intl
    try {
      const tmpData = this.pubspecDoc.get('flutter_intl') as YAMLMap
      if (YAML.isMap(tmpData)) {
        this.flutterIntlConfig = tmpData.toJSON()
      }
      // let mainLocale = this.flutterIntlConfig.main_locale
      // if (!(typeof mainLocale === 'string' && mainLocale.length > 0)) {
      //   mainLocale = "en" // 默认是英文
      // }
    } catch (error) {
      console.log('getCurrentPubspecDoc - flutter_intl, error: ', error)
    }

    // flutter gen
    try {
      const tmpData = this.pubspecDoc.get('flutter_gen') as YAMLMap
      if (YAML.isMap(tmpData)) {
        this.flutterGenConfig = tmpData.toJSON()
      }
    } catch (error) {
      console.log('getCurrentPubspecDoc - flutter_gen, error: ', error)
    }

    // flutter assets generator by Cr1992
    try {
      const tmpData = this.pubspecDoc.get('flutter_assets_generator') as YAMLMap
      if (YAML.isMap(tmpData)) {
        this.flutterAssetsGeneratorConfigByCr1992 = tmpData.toJSON()
      } else {
        this.flutterAssetsGeneratorConfigByCr1992 = {
          auto_detection: true,
          named_with_parent: true,
        }
      }
    } catch (error) {
      console.log('getCurrentPubspecDoc - flutter_assets_generator, error: ', error)
    }

    console.log('getCurrentPubspecDoc end')
  }

  private async getCurrentAssetsFileTree() {
    let flutterMap = this.pubspecDoc.get('flutter') as YAMLMap
    let pathsSettings = flutterMap.get('assets') as YAMLSeq

    if (!YAML.isSeq(pathsSettings)) {
      console.log('getCurrentAssetsFileTree, assetsSettings is not array')
      return
    }
    const paths: any[] = pathsSettings.items
    let nodes: AssetsTreeNode[] = []

    for (const tmpPath of paths) {
      let fullPath = this.dir + "/" + tmpPath.value
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
    for (let cb of this.refreshTreeViewCallbackList) {
      cb(TreeViewType.assets)
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
    const pathsSettings = this.pubspecDoc.get('flutter_intl') as YAMLMap
    if (!YAML.isMap(pathsSettings)) {
      console.log('getCurrentLocalizationFileTree, assetsSettings is not array')
      return
    }

    let l10nFilesDir: string = `${this.dir}/lib/l10n`
    let configL10nFilesDir: any = pathsSettings.get('arb-dir')
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
    for (let cb of this.refreshTreeViewCallbackList) {
      cb(TreeViewType.localizations)
    }
  }

  public addTreeViewRefreshCallback(callback: TreeViewRefreshCallback) {
    this.removeTreeViewRefreshCallback(callback)
    this.refreshTreeViewCallbackList.push(callback)
  }

  public removeTreeViewRefreshCallback(callback: TreeViewRefreshCallback) {
    const list: TreeViewRefreshCallback[] = []
    for (let cb of this.refreshTreeViewCallbackList) {
      if (cb === callback) {
        continue
      }
      list.push(cb)
    }
    this.refreshTreeViewCallbackList = list
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

  // MARK: - generator
  public async runAssetsGenerator(type: FlutterAssetsConfigType, config: any) {
    const projectInfo: ProjectInfoMsgInterface = {
      dir: this.dir,
      name: this.projectName,
      watcherTypes: this.watcherTypes,
    }
    switch (type) {
      case FlutterAssetsConfigType.Cr1992:
        try {
          await AssetsGenerator.getInstance().runCr1992Generator(projectInfo, config)
        } catch (error) {
          console.log('runAssetsGenerator - error: ', error)
        }
        break;

      case FlutterAssetsConfigType.FlutterGen: {
        try {
          await AssetsGenerator.getInstance().runFlutterGen(projectInfo, config)
        } catch (error) {
          console.log('runAssetsGenerator - error: ', error)
        }
      }
        break;

      default:
        break;
    }
  }

  public async readAssetsGeneratorConfig(type: FlutterAssetsConfigType) {
    await this.refresh()
    vscode.window.setStatusBarMessage("Flutter XGen: assets 生成器配置读取完成", 3000)
  }

  public async saveAssetsGeneratorConfig(type: FlutterAssetsConfigType, config: any) {
    switch (type) {
      case FlutterAssetsConfigType.Cr1992: {
        if (config === null) {
          return
        }
        const key: string = 'flutter_assets_generator'
        if (this.pubspecDoc.has(key)) {
          this.pubspecDoc.delete(key)
        }
        const pair = this.pubspecDoc.createPair(key, config)
        this.pubspecDoc.add(pair)
        // TODO: 加入换行符
        this.saveCurrentPubspec()
        await this.refresh()
        vscode.window.setStatusBarMessage("Flutter XGen: pubspec.yaml 保存成功", 3000)
      }
        break;

      case FlutterAssetsConfigType.FlutterGen:

        break;
      default:
        break;
    }
  }
}
