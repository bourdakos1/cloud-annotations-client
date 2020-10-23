import React from 'react'
import ReactDOM from 'react-dom'
import GoogleAnalytics from 'react-ga'
import thunk from 'redux-thunk'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'

import Routing from './Routing'
import { unregister } from './registerServiceWorker'
import reducers from './redux/reducers'
import { reset, updateHeadCount } from 'redux/editor'
import history from 'globalHistory'
import socket from 'globalSocket'

import 'carbon-components/css/carbon-components.min.css'
import './index.css'
import './bx-overrides.css'
import {
  createBox,
  deleteBox,
  deleteLabel,
  createLabel,
  deleteImages,
  uploadImages,
  labelImages,
  labelImagesV2,
  clearLabels
} from 'redux/collection'

// Global Settings:
window.FPS = 3
window.MAX_IMAGE_WIDTH = 1500
window.MAX_IMAGE_HEIGHT = 1500
window.IMAGE_SCALE_MODE = 'ASPECT_FIT' // || 'SCALE_FILL' || false

GoogleAnalytics.initialize('UA-130502274-1')

// Setup theme - should I even do light mode?
const activateDarkMode = () => {
  document.body.className = 'dark'
}
const activateLightMode = () => {
  document.body.className = 'light'
}
if (
  localStorage.getItem('darkMode') === 'true' ||
  localStorage.getItem('darkMode') === 'false'
) {
  // If the user specified using the switch we obey.
  const isDarkMode = localStorage.getItem('darkMode') === 'true'
  if (isDarkMode) {
    activateDarkMode()
  } else {
    activateLightMode()
  }
} else {
  // if the user did nothing we try system preference.
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addListener(e => e.matches && activateDarkMode())
  window
    .matchMedia('(prefers-color-scheme: light)')
    .addListener(e => e.matches && activateLightMode())

  if (isDarkMode) {
    activateDarkMode()
  }
  if (isLightMode) {
    activateLightMode()
  }
  if (!isDarkMode && !isLightMode) {
    activateDarkMode()
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const store = createStore(reducers, composeEnhancers(applyMiddleware(thunk)))

// Clear store on history change.
history.listen(() => store.dispatch(reset()))
socket.on('patch', res => {
  const { op, value } = res
  const {
    clearAllLabels,
    bulkLabelV2,
    bulkLabel,
    annotations,
    images,
    labels
  } = value

  if (labels) {
    if (op === '+') {
      store.dispatch(createLabel(labels.label, false))
      return
    }
    if (op === '-') {
      store.dispatch(deleteLabel(labels.label, false))
      return
    }
  }

  if (images) {
    if (op === '+') {
      store.dispatch(uploadImages(images.images, false))
      return
    }
    if (op === '-') {
      store.dispatch(deleteImages(images.images, false))
      return
    }
  }

  if (annotations) {
    if (op === '+') {
      store.dispatch(createBox(annotations.image, annotations.box, false))
      return
    }
    if (op === '-') {
      store.dispatch(deleteBox(annotations.image, annotations.box, false))
      return
    }
  }

  if (bulkLabel) {
    if (op === '+') {
      store.dispatch(labelImages(bulkLabel.images, bulkLabel.label, false))
      return
    }
  }

  if (bulkLabelV2) {
    store.dispatch(
      labelImagesV2(bulkLabel.images, bulkLabel.label, bulkLabel.onlyOne, false)
    )
    return
  }

  if (clearAllLabels) {
    store.dispatch(clearLabels(bulkLabel.images, false))
    return
  }
})

socket.on('theHeadCount', count => {
  store.dispatch(updateHeadCount(count))
})

ReactDOM.render(
  <Provider store={store}>
    <Routing />
  </Provider>,
  document.getElementById('root')
)
unregister()
