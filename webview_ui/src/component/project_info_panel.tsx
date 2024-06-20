import { ProjectInfoMsgInterface } from '../enum/vscode_extension.type'

const FXGProjectInfoPanel = (props: ProjectInfoMsgInterface) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 14 }}>{`项目名称:  ${props.name}`}</div>
      <div style={{ height: 10 }} />
      <div style={{ fontSize: 14 }}>{`项目路径:  ${props.dir}`}</div>
      <div style={{ height: 10 }} />
      <div style={{ display: 'flex', width: '100%', height: 1, backgroundColor: '#fff' }} />
      <div style={{ height: 20 }} />
    </div>
  )
}

export default FXGProjectInfoPanel
