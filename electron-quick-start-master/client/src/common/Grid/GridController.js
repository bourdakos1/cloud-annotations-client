import React, { Component } from 'react'
import GridItem from './GridItem'
import styles from './GridController.module.css'

const SafetyNet = collection => {
  const fillWith = type => {
    return Object.keys(collection).reduce((acc, key) => {
      return [...acc, ...collection[key].map(() => type)]
    }, [])
  }
  const safeSelection = fillWith(false)
  return {
    selection: selection =>
      selection && safeSelection.length === selection.length
        ? [...selection]
        : safeSelection,
    fullSelection: fillWith(true),
    emptySelection: safeSelection
  }
}

export default class GridController extends Component {
  state = {
    dragging: false,
    lastSelectedIndex: null,
    dragStartIndex: null,
    dragStartSection: null,
    intermediateSelection: null
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('mouseup', this.handleDragEnd)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('mouseup', this.handleDragEnd)
  }

  handleKeyDown = e => {
    const char = e.key.toLowerCase()
    // For MAC we can use metaKey to detect cmd key
    if ((e.ctrlKey || e.metaKey) && char === 'a') {
      e.preventDefault()
      this.selectAll()
    }
  }

  handleItemSelected = (e, index) => {
    const { collection, selection } = this.props
    const shiftPressed = e.shiftKey

    const safeSelection = SafetyNet(collection).selection(selection)

    this.setState(
      prevState => {
        let lastSelectedIndex = prevState.lastSelectedIndex
        if (shiftPressed && lastSelectedIndex !== null) {
          // The default sort for arrays in Javascript is alphabetical.
          const [min, max] = [lastSelectedIndex, index].sort((a, b) => a - b)

          /**
           * If the last selected index was a deselect and you try to select a
           * deselected tile, select everything in between. Otherwise, nothing
           * would happen, which causes confusion.
           *
           * if selection[lastSelectedIndex] === false {
           *   type = !selection[index]
           * }
           */
          for (let i = min; i <= max; i++) {
            safeSelection[i] =
              safeSelection[lastSelectedIndex] || !safeSelection[index]
          }
        } else {
          safeSelection[index] = !safeSelection[index]
          lastSelectedIndex = index
        }
        // If nothing is selected clear the last selected index.
        if (safeSelection.filter(item => item).length === 0) {
          lastSelectedIndex = null
        }
        return {
          lastSelectedIndex: lastSelectedIndex
        }
      },
      () => {
        this.props.onSelectionChanged(safeSelection)
      }
    )
  }

  handleDragStart = (section, index) => {
    this.setState({
      dragging: true,
      dragStartIndex: index,
      dragStartSection: section
    })
  }

  handleItemEntered = (section, index) => {
    const { collection, selection, sections } = this.props
    const { dragging, dragStartIndex, dragStartSection } = this.state

    if (!dragging) {
      return
    }

    const i = sections.findIndex(section => section.name === dragStartSection)
    const sectionStart = sections
      .slice(0, i)
      .reduce((acc, b) => acc + b.count, 0)
    const sectionEnd = sectionStart + sections[i].count

    const columnCount = this.calculateColumnCount()
    const normalizedStartIndex = dragStartIndex - sectionStart
    const normalizedEndIndex = index - sectionStart

    const x1 = normalizedStartIndex % columnCount
    const y1 = Math.floor(normalizedStartIndex / columnCount)
    const x2 = normalizedEndIndex % columnCount
    const y2 = Math.floor(normalizedEndIndex / columnCount)

    const safeSelection = SafetyNet(collection).selection(selection)
    const intermediateSelection = safeSelection.map((selectState, index) => {
      // If item is outside of the selection, return the same state.
      if (sectionStart > index || index >= sectionEnd) {
        return selectState
      }

      const normalizedIndex = index - sectionStart
      const x = normalizedIndex % columnCount
      const y = Math.floor(normalizedIndex / columnCount)

      const yInRange = Math.min(y2, y1) <= y && y <= Math.max(y2, y1)
      const xInRange = Math.min(x2, x1) <= x && x <= Math.max(x2, x1)
      if (xInRange && yInRange) {
        return !safeSelection[dragStartIndex]
      }

      return selectState
    })

    this.setState({
      intermediateSelection: intermediateSelection
    })
  }

  handleDragEnd = () => {
    const { collection, selection, onSelectionChanged } = this.props
    const { dragging } = this.state

    if (!dragging) {
      return
    }

    const safeSelection = SafetyNet(collection).selection(selection)
    const mergedSelection = this.state.intermediateSelection || safeSelection
    this.setState(
      prevState => {
        // If we dragged a selection, we don't want a last selected for shift click.
        const lastSelectedIndex = prevState.intermediateSelection
          ? null
          : prevState.lastSelectedIndex

        return {
          dragging: false,
          dragStartIndex: null,
          dragEndIndex: null,
          lastSelectedIndex: lastSelectedIndex,
          intermediateSelection: null
        }
      },
      () => {
        onSelectionChanged(mergedSelection)
      }
    )
  }

  calculateColumnCount = () =>
    parseInt(
      window
        .getComputedStyle(this.gridRef, null)
        .getPropertyValue('grid-template-columns')
        .split('px').length - 1,
      10
    )

  selectAll = () => {
    const { collection, onSelectionChanged } = this.props
    onSelectionChanged(SafetyNet(collection).fullSelection)
  }

  render() {
    const { sections, collection, selection, gridItem, className } = this.props
    const mergedSelection = this.state.intermediateSelection || selection
    return (
      <div className={className}>
        {sections.map(
          (i => section => {
            return (
              <div key={section.name}>
                {section.count > 0 && (
                  <div>
                    <div className={styles.sectionTitle}>
                      <div className={styles.sectionSpan}>{section.name}</div>
                    </div>
                    <div
                      className={styles.grid}
                      ref={ref => {
                        this.gridRef = ref
                      }}
                    >
                      {collection[section.name].map(itemData => {
                        i++
                        return (
                          <GridItem
                            index={i}
                            section={section.name}
                            key={itemData}
                            itemData={itemData}
                            selected={mergedSelection && mergedSelection[i]}
                            onItemSelected={this.handleItemSelected}
                            onDragStart={this.handleDragStart}
                            onItemEntered={this.handleItemEntered}
                            gridItem={gridItem}
                          />
                        )
                      })}
                    </div>
                    <div className={styles.gap} />
                  </div>
                )}
              </div>
            )
          })(-1)
        )}
      </div>
    )
  }
}
