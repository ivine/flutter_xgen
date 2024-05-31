import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"

interface FXGButtonInterface {
  title: string
  disabled?: boolean
  topSpacing?: number
  leftSpacing?: number
  bottomSpacing?: number
  rightSpacing?: number
  onClick: () => void
}

function FXGButton(props: FXGButtonInterface) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ height: props.topSpacing ?? 0 }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: props.leftSpacing ?? 0 }} />
        <VSCodeButton disabled={props.disabled ?? false} onClick={props.onClick}>{props.title}</VSCodeButton>
        <div style={{ width: props.rightSpacing ?? 0 }} />
      </div>
      <div style={{ height: props.bottomSpacing ?? 0 }} />
    </div>
  )
}

export default FXGButton