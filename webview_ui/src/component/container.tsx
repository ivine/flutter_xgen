import React, { CSSProperties, ReactNode } from "react";

interface FXGContainerInterface {
  children?: React.ReactNode
  style?: CSSProperties
  display?: 'flex' | 'block' | 'inline-block' | 'inline' | 'grid'
  flexDirection?: 'row' | 'column'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'baseline' | 'stretch'
  boxSizing?: 'content-box' | 'border-box'
  width?: number
  height?: number
  backgroundColor?: string
  onClick?: () => void
}

const FXGContainer = (props: FXGContainerInterface) => {
  const removeProperty = (propKey, { [propKey]: propValue, ...rest }) => rest
  const removeProperties = (object, ...keys) => (keys.length ? removeProperties(removeProperty(keys.pop(), object), ...keys) : object)

  const defaultStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box',
  }
  let style = Object.assign({}, defaultStyle)

  if (typeof props === 'object') {
    let customStyle: any = { ...props }
    customStyle = removeProperties(customStyle, 'style', 'onClick')
    style = Object.assign({}, defaultStyle, customStyle)
    if (props.hasOwnProperty('style')) {
      style = Object.assign({}, style, props.style)
    }
    return (
      <div style={style} onClick={props.onClick}>
        {props.children}
      </div>
    )
  } else {
    return <div style={style} />
  }
}

export default FXGContainer
