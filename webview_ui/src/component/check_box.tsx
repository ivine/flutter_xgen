import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"

interface FXGCheckBoxInterface {
  checked: boolean
  title?: string
  spacing?: number
  onChange?: (value: any) => void
}

function FXGCheckBox(props: FXGCheckBoxInterface) {
  const spacing = props.spacing ?? 10
  return (
    <>
      <div style={{ height: spacing }} />
      <VSCodeCheckbox
        style={{ height: 30 }}
        checked={props.checked}
        onChange={(e) => {
          props.onChange(e.target._currentValue)
        }}
      >
        {props.title ?? ''}
      </VSCodeCheckbox>
      <div style={{ height: spacing }} />
    </>
  )
}

export default FXGCheckBox