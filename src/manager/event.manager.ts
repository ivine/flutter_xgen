const EventEmitter = require('events')

export enum EventBusType {
  refreshAssetsTreeView = 'refreshAssetsTreeView',
  refreshL10nTreeView = 'refreshL10nTreeView'
}

class EventBus extends EventEmitter {}

export const eventBus = new EventBus()
