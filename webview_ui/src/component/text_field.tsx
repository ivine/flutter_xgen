import { VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { TextFieldType } from '@vscode/webview-ui-toolkit'
import { getStringOrEmpty } from '../util/string.util'

interface FXGTextFieldInterface {
  title?: string
  value: string
  tfType: TextFieldType
  placeholder?: string
  spacing?: number
  onChange?: (value: any) => void
}

function FXGTextField(props: FXGTextFieldInterface) {
  const spacing = props.spacing ?? 10
  return (
    <>
      <div style={{ height: spacing }} />
      <VSCodeTextField
        type={props.tfType}
        placeholder={props.placeholder ?? ''}
        style={{ height: 60 }}
        value={getStringOrEmpty(props.value)}
        onChange={(e) => {
          const value = e.target._value
          props.onChange(value)
        }}
      >
        {props.title ?? ''}
      </VSCodeTextField>
      <div style={{ height: spacing }} />
    </>
  )
}

export default FXGTextField
