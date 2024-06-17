import { FileUtil } from '../util/file.util'
import { FXGFile } from './base'

export class IntlArbFile extends FXGFile {
  rowItems: IntlArbRowItem[] = []
  json: any = null

  constructor(path: string) {
    super(path)

    this.setup()
  }

  async setup() {
    let data = await FileUtil.readFile(this.path)
    if (!data) {
      return
    }
    let tmpRowItems: IntlArbRowItem[] = []
    try {
      this.json = JSON.parse(data)
      for (let key of Object.keys(this.json)) {
        let value = this.json[key]
        let item: IntlArbRowItem = new IntlArbRowItem(key, value)
        tmpRowItems.push(item)
      }
      this.rowItems = tmpRowItems
    } catch (error) {
      console.log('IntlArbFile - setup, error: ', error)
    }
  }
}

export class IntlArbRowItem {
  key: string
  value: string

  constructor(key: string, value: string) {
    this.key = key
    this.value = value
  }
}

// Generated -- IntlUtil 生成
