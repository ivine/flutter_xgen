interface FXGSpacerInterface {
  width?: number
  height?: number
}

const FXGSpacer = (props: FXGSpacerInterface) => {
  if (typeof props === 'object') {
    const w = props.width
    const h = props.height
    if (typeof w === 'number' && typeof h !== 'number') {
      return <div style={{ display: 'flex', width: w }} />
    } else if (typeof w !== 'number' && typeof h === 'number') {
      return <div style={{ display: 'flex', height: h }} />
    } else {
      return <div style={{ display: 'flex', flexGrow: 1 }} />
    }
  } else {
    return <div style={{ display: 'flex', flexGrow: 1 }} />
  }
}

export default FXGSpacer