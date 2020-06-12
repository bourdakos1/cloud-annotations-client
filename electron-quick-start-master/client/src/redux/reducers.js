import { combineReducers } from 'redux'
import accountsReducer from './accounts'
import resourcesReducer from './resources'
import wmlResourcesReducer from './wmlResources'
import profileReducer from './profile'
import bucketsReducer from './buckets'
import collectionReducer from './collection'
import editorReducer from './editor'
import autoLabelReducer from './autoLabel'

export default combineReducers({
  accounts: accountsReducer,
  resources: resourcesReducer,
  wmlResources: wmlResourcesReducer,
  profile: profileReducer,
  buckets: bucketsReducer,
  collection: collectionReducer,
  editor: editorReducer,
  autoLabel: autoLabelReducer
})
