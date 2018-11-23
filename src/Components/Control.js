import React, { Component } from 'react';
import Toggle from "react-toggle-component"
import "react-toggle-component/styles.css"
import {Button, ButtonGroup, ButtonToolbar} from 'react-bootstrap/lib'
import {ToggleButton, ToggleButtonGroup} from 'react-bootstrap/lib'

import New from './icon/New.svg'
import Undo from './icon/Undo.svg'
import Redo from './icon/Redo.svg'
import '../Game.css';
{/* <Toggle label="AI" checked={this.props.aimode} onToggle={this.props.toggle} disabled = {!active}/> */}
class Control extends Component {
    render() {
        let active = this.props.active
        return (
            <div className="Control">
                
                    <div className="control-ai">
                        <Toggle label="AI" checked={this.props.aimode} onToggle={this.props.toggle} disabled = {!active}/> 
                    </div>
                    <div className="control-level">
                        <ButtonToolbar>             
                        <ToggleButtonGroup type="radio" name="options" defaultValue={2} onChange={this.props.level}>
                        <ToggleButton className = "element" value={1} disabled = {!active}>Easy</ToggleButton>
                        <ToggleButton className = "element" value={2} disabled = {!active}>Medium</ToggleButton>
                        <ToggleButton className = "element" value={3} disabled = {!active}>Hard</ToggleButton>
                        </ToggleButtonGroup>
                        </ButtonToolbar>  
                    </div>
                    <div className="control-act">
                        <ButtonGroup>
                        <Button className = "element" onClick = {this.props.restart} disabled = {!active}> <img src={New} /> </Button>
                        <Button className = "element" onClick = {this.props.undo} disabled = {!active}> <img src={Undo} />  </Button>
                        <Button className = "element" onClick = {this.props.redo} disabled = {!active}> <img src={Redo} />  </Button>
                        </ButtonGroup>     
                    </div>
                
            </div>
        )
    }
}

export default Control