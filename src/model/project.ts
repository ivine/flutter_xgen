import * as vscode from 'vscode'
import { debounce } from 'lodash'
const fs = require('fs')
const p = require('path')
import YAML, { Document, YAMLMap, YAMLSeq } from 'yaml'

import { FileUtil } from '../util/file.util'
import TreeViewUtil from '../tree_view/tree_view.util'
import { AssetsTreeNode, IntlTreeNode, TreeNodeType } from '../tree_view/tree_node'

import WatcherManager, { FileWatcher, WatcherEventType } from '../manager/watcher.manager'

import { PreviewItem } from './preview'
import { FlutterAssetsGeneratorConfigByCr1992, FlutterGenConfig, FlutterIntlConfig } from './project.enum'
import {
  FXGWatcherType,
  FlutterPubspecYamlConfigType,
  InteractionEvent,
  InteractionEventType,
  ProjectInfoMsgInterface
} from '../webview/const'
import AssetsGenerator from '../generator/assets/assets.generator'
import { FXGUIWebPanel } from '../webview/fxg_web_panel'
import StoreManager from '../manager/store.manager'
import IntlGenerator from '../generator/intl/intl.generator'
import { EventBusType, eventBus } from '../manager/event.manager'
import WorkspaceManager from '../manager/workspace.manager'

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

  assetsDirPath: string = ''
  l10nsDirPath: string = ''

  watcherTypes: FXGWatcherType[] = []
  assetsDirWatcher: FileWatcher | null = null
  l10nsDirWatcher: FileWatcher | null = null
  assetsDirWatchEventDebounce: (eventType: WatcherEventType, uri: vscode.Uri) => void
  l10nDirWatchEventDebounce: (eventType: WatcherEventType, uri: vscode.Uri) => void

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
      this.getCurrentL10nFileTree()
      this.addWatchers()
      this.setupWatchersDebounce()
    } catch (error) {
      console.log('FXGProject - setup, error:', error)
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
      this.getCurrentL10nFileTree()
    })
  }

  public setupWatchersDebounce() {
    this.assetsDirWatchEventDebounce = debounce((eventType: WatcherEventType, uri: vscode.Uri) => {
      this.setWatcherCallback(uri, eventType, FXGWatcherType.assets_cr1992)
      this.setWatcherCallback(uri, eventType, FXGWatcherType.assets_flutter_gen)
    }, 300)
    this.l10nDirWatchEventDebounce = debounce((eventType: WatcherEventType, uri: vscode.Uri) => {
      this.setWatcherCallback(uri, eventType, FXGWatcherType.l10n)
    }, 300)
  }

  public setWatcherCallback(uri: vscode.Uri, eventType: WatcherEventType, watcherType: FXGWatcherType) {
    const enable = StoreManager.getInstance().getWatcherEnable(this.dir, watcherType)
    if (!enable) {
      return
    }
    const project: FXGProject = WorkspaceManager.getInstance().getProjectByDir(this.dir)
    if (project.pubspecDoc === null) {
      return
    }
    const projectInfo: ProjectInfoMsgInterface = {
      name: this.projectName,
      dir: this.dir,
      watcherTypes: this.watcherTypes
    }
    switch (watcherType) {
      case FXGWatcherType.assets_cr1992:
        {
          if (eventType === WatcherEventType.onChanged || this.flutterAssetsGeneratorConfigByCr1992 === null) {
            return
          }
          AssetsGenerator.getInstance().runCr1992Generator(projectInfo, this.flutterAssetsGeneratorConfigByCr1992)
        }
        break

      case FXGWatcherType.assets_flutter_gen:
        {
          if (eventType === WatcherEventType.onChanged || this.flutterGenConfig === null) {
            return
          }
          AssetsGenerator.getInstance().runFlutterGen(projectInfo, this.flutterGenConfig)
        }
        break

      case FXGWatcherType.l10n:
        IntlGenerator.getInstance().run(projectInfo, this.flutterIntlConfig)
        break
      default:
        break
    }
  }

  public setWatcherEnable(enable: boolean, type: FXGWatcherType) {
    StoreManager.getInstance().setWatcherEnable(enable, this.dir, type)
    let title: string = ''
    if (type === FXGWatcherType.assets_cr1992) {
      title = 'Cr1992 Asset'
    } else if (type === FXGWatcherType.assets_flutter_gen) {
      title = 'FlutterGen Asset'
    } else if (type === FXGWatcherType.l10n) {
      title = 'FlutterIntl L10n'
    }
    if (title.length > 0) {
      vscode.window.setStatusBarMessage(`Flutter XGen: ${title} 生成器监听${enable ? '开启' : '关闭'}`, 3000)
    }
  }

  public dispose() {
    this.assetNodes = []
    this.assetOneDimensionalPreviewNodes = []
    this.l10nNodes = []

    WatcherManager.getInstance().stopWatch(this.assetsDirWatcher)
    WatcherManager.getInstance().stopWatch(this.l10nsDirWatcher)
  }

  public async refresh(eventType: InteractionEventType, data: any | null = null) {
    await this.getCurrentPubspecDoc()
    const projectInfo: ProjectInfoMsgInterface = {
      name: this.projectName,
      dir: this.dir,
      watcherTypes: this.watcherTypes
    }
    const event: InteractionEvent = {
      timestamp: Date.now(),
      eventType: eventType,
      projectInfo: projectInfo,
      data: data
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
    let result: string = ''
    try {
      result = this.pubspecDoc.get('name') as string
    } catch (error) {}
    return result
  }

  // MARK: - Private
  private async getCurrentPubspecDoc() {
    let pubspecPath = `${this.dir}/pubspec.yaml`
    if (!FileUtil.pathExists(pubspecPath)) {
      console.log('pubspec no exist, TODO: add alert')
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
          named_with_parent: true
        }
      }
    } catch (error) {
      console.log('getCurrentPubspecDoc - flutter_assets_generator, error: ', error)
    }

    console.log('getCurrentPubspecDoc end')
  }

  private async getCurrentAssetsFileTree() {
    if (this.pubspecDoc === null) {
      return
    }
    let flutterMap = this.pubspecDoc.get('flutter') as YAMLMap
    let pathsSettings = flutterMap.get('assets') as YAMLSeq

    if (!YAML.isSeq(pathsSettings)) {
      console.log('getCurrentAssetsFileTree, assetsSettings is not array')
      return
    }
    const paths: any[] = pathsSettings.items
    let nodes: AssetsTreeNode[] = []

    for (const tmpPath of paths) {
      let fullPath = this.dir + '/' + tmpPath.value
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

        true
      )
      nodes.push(node)
    }
    this.assetNodes = nodes

    eventBus.emit(EventBusType.refreshAssetsTreeView)

    // 生成一维数组
    // this.assetOneDimensionalPreviewNodes = this.getOneDimensionalPreviewNodes(nodes)

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

        true
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

  private async getCurrentL10nFileTree() {
    // flutter_intl
    if (this.pubspecDoc === null) {
      return
    }
    const pathsSettings = this.pubspecDoc.get('flutter_intl') as YAMLMap
    if (!YAML.isMap(pathsSettings)) {
      console.log('getCurrentLocalizationFileTree, assetsSettings is not array')
      return
    }

    let l10nFilesDir: string = `${this.dir}/lib/l10n`
    let configL10nFilesDir: any = pathsSettings.get('arb-dir')
    if (typeof configL10nFilesDir === 'string' && configL10nFilesDir.length > 0) {
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

        true
      )
      nodes.push(node)
    }

    this.l10nNodes = nodes

    eventBus.emit(EventBusType.refreshL10nTreeView)
  }

  public getPreviewItem(selectedItem: string | null, previous: boolean, next: boolean): PreviewItem {
    let path = selectedItem
    if (!(typeof path === 'string' && path.length > 0)) {
      path = this.assetOneDimensionalPreviewNodes[0].nodeAbsolutePath
    }

    if (previous) {
      let index = this.assetOneDimensionalPreviewNodes.findIndex((e) => e.nodeAbsolutePath === path)
      index = Math.min(Math.max(0, index - 1), this.assetOneDimensionalPreviewNodes.length - 1)
      path = this.assetOneDimensionalPreviewNodes[index].nodeAbsolutePath
    } else if (next) {
      let index = this.assetOneDimensionalPreviewNodes.findIndex((e) => e.nodeAbsolutePath === path)
      index = Math.min(Math.max(0, index + 1), this.assetOneDimensionalPreviewNodes.length - 1)
      path = this.assetOneDimensionalPreviewNodes[index].nodeAbsolutePath
    }

    let result: PreviewItem = new PreviewItem(path)
    return result
  }

  // MARK: - generator
  public async runGenerator(type: FlutterPubspecYamlConfigType, config: any, data: any | null = null) {
    const projectInfo: ProjectInfoMsgInterface = {
      dir: this.dir,
      name: this.projectName,
      watcherTypes: this.watcherTypes
    }
    switch (type) {
      case FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992:
        try {
          await AssetsGenerator.getInstance().runCr1992Generator(projectInfo, config)
        } catch (error) {
          console.log('runCr1992Generator - error: ', error)
        }
        break

      case FlutterPubspecYamlConfigType.flutter_gen:
        {
          try {
            await AssetsGenerator.getInstance().runFlutterGen(projectInfo, config)
          } catch (error) {
            console.log('runFlutterGen - error: ', error)
          }
        }
        break

      case FlutterPubspecYamlConfigType.flutter_intl:
        {
          if (data === null) {
            return
          }
          try {
            const jsonMap = JSON.parse(data) as object
            // 保存到本地
            for (let arbFileName of Object.keys(jsonMap)) {
              const json = jsonMap[arbFileName]
              const tmpJsonStr = JSON.stringify(json, null, 2)
              const filePath = `${this.l10nsDirPath}/${arbFileName}`
              await FileUtil.writeFile(filePath, tmpJsonStr)
            }

            // 执行
            await IntlGenerator.getInstance().run(projectInfo, config)
          } catch (error) {
            console.log('IntlGenerator.getInstance().run - error: ', error)
          }
        }
        break

      default:
        break
    }
  }

  public async readAssetsGeneratorConfig(type: FlutterPubspecYamlConfigType) {
    try {
      switch (type) {
        case FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992:
        case FlutterPubspecYamlConfigType.flutter_gen:
          await this.refresh(InteractionEventType.extToWeb_configs_assets, null)
          break

        case FlutterPubspecYamlConfigType.flutter_intl:
          await this.refresh(InteractionEventType.extToWeb_configs_localization, null)
          break

        default:
          break
      }
      vscode.window.setStatusBarMessage('Flutter XGen: 生成器配置读取完成', 3000)
    } catch (error) {
      console.log('readAssetsGeneratorConfig, error: ', error)
    }
  }

  public async saveFlutterPubspecYamlConfig(type: FlutterPubspecYamlConfigType, config: any) {
    try {
      switch (type) {
        case FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992:
          {
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
            await this.refresh(InteractionEventType.extToWeb_configs_assets, null)
          }
          break

        case FlutterPubspecYamlConfigType.flutter_gen:
          {
            if (config === null) {
              return
            }
            const key: string = 'flutter_gen'
            if (this.pubspecDoc.has(key)) {
              this.pubspecDoc.delete(key)
            }
            const pair = this.pubspecDoc.createPair(key, config)
            this.pubspecDoc.add(pair)
            // TODO: 加入换行符
            this.saveCurrentPubspec()
            await this.refresh(InteractionEventType.extToWeb_configs_assets, null)
          }
          break

        case FlutterPubspecYamlConfigType.flutter_intl:
          {
            if (config === null) {
              return
            }
            const key: string = 'flutter_intl'
            if (this.pubspecDoc.has(key)) {
              this.pubspecDoc.delete(key)
            }
            const pair = this.pubspecDoc.createPair(key, config)
            this.pubspecDoc.add(pair)
            this.saveCurrentPubspec()
            await this.refresh(InteractionEventType.extToWeb_configs_localization, null)
          }
          break

        default:
          break
      }
      vscode.window.setStatusBarMessage('Flutter XGen: pubspec.yaml 保存成功', 3000)
    } catch (error) {
      console.log('saveFlutterPubsepcYamlConfig, error: ', error)
    }
  }
}
