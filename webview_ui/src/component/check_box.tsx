import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import FXGContainer from "./container"
import FXGSpacer from "./spacer"

interface FXGCheckBoxInterface {
  checked: boolean
  title?: string
  enabled?: boolean
  topSpacing?: number
  leftSpacing?: number
  bottomSpacing?: number
  rightSpacing?: number
  onChange?: (value: any) => void
}

function FXGCheckBox(props: FXGCheckBoxInterface) {
  let checked = false
  let enabled = true
  let topS = 0
  let leftS = 0
  let bottomS = 0
  let rightS = 0
  if (typeof props === 'object') {
    checked = typeof props.checked === 'boolean' ? props.checked : false
    enabled = typeof props.enabled === 'boolean' ? props.enabled : false
    topS = typeof props.topSpacing === 'number' ? props.topSpacing : 0
    leftS = typeof props.leftSpacing === 'number' ? props.leftSpacing : 0
    bottomS = typeof props.bottomSpacing === 'number' ? props.bottomSpacing : 0
    rightS = typeof props.rightSpacing === 'number' ? props.rightSpacing : 0
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        opacity: enabled ? 1 : '0.5',
        pointerEvents: enabled ? 'auto' : 'none',
      }}
    >
      <div style={{ width: leftS }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: topS }} />
        <FXGContainer height={30} flexDirection="row" onClick={() => { props.onChange(!props.checked) }}>
          <input
            style={{ width: 16, height: 16 }}
            type={'checkbox'}
            checked={checked}
            onChange={(e) => {
              props.onChange(!checked)
            }}
          />
          <FXGSpacer width={4} />
          <div style={{ color: '#fff', fontSize: 14 }}>{props.title ?? ''}</div>
        </FXGContainer>
        <div style={{ height: bottomS }} />
      </div>
      <div style={{ width: rightS }} />
    </div>
  )
}

export default FXGCheckBox