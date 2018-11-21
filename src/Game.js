import React, { Component } from 'react';
import Toggle from "react-toggle-component"
import "react-toggle-component/styles.css"
import {Button, ButtonGroup} from 'react-bootstrap/lib'
//import {Grid, Row, Col} from 'react-bootstrap/lib'

import AI from './AI.js'
import Board from './Board.js'
import New from './icon/New.svg'
import Undo from './icon/Undo.svg'
import Redo from './icon/Redo.svg'
import './Game.css';

const DIR = [     [-1, 1], [-1, 0], [-1, -1],
                    [0, 1],          [0, -1],
                    [1, 1], [1, 0], [1, -1] ];

class Game extends Component {

    pause = 10

    agent
    agentX = 0
    agentY = 0
    agentAct = 'UNCOVER'

    RESTART = false

    constructor(props){
        super(props)
        let rows = 16
        let cols = 16
        let mines = 40 

        let start = this.generateBoard(rows, cols, mines)

        this.state = {
            history: [{
                flag: mines,
                cover: rows*cols-mines,
                board: start.board,
                gameover: false,
            }],
            step: 0,
            rows: rows,
            cols: cols,
            mines: mines,
            start: start.pos,
            aimode: true,
        }

        this.uncoverClick = this.uncoverClick.bind(this)
        this.flagClick = this.flagClick.bind(this)
        this.undo = this.undo.bind(this)
        this.redo = this.redo.bind(this)
        this.restart = this.restart.bind(this)
        this.aitoggle = this.aitoggle.bind(this)

        this.agent = new AI({rows: rows, cols: cols, mines: mines, start: start.pos})
        this.agentX = start.pos.x
        this.agentY = start.pos.y
        this.agentAct = 'UNCOVER'
    }

    generateBoard(rows, cols, mines){
        let ary = Array(rows*cols).fill(0).map((val, idx) => {
            let tile = {mine: false, number: 0, flag: false, uncover: false, x: 0, y:0};
            if(idx < mines){ tile.mine = true; tile.number = -1; tile.uncover = false; }
            return tile
        }).sort((a, b) => {return 0.5 - Math.random()})

        let board = []
        while(ary.length) board.push(ary.splice(0,cols))

        let zerotils = []
        for(let i=0; i<rows; i++){
            for(let j=0; j<cols; j++){
                board[i][j].x = i
                board[i][j].y = j
                if(!board[i][j].mine) countNeighbor(i, j)  
                if(board[i][j].number === 0) zerotils.push(board[i][j])
            }
        }

        function countNeighbor(i, j){
            DIR.forEach(d => {
                let nr = i + d[0]
                let nc = j + d[1]
                if(inBound(nr, nc) && board[nr][nc].mine)
                    board[i][j].number++
            })
           
        }

        function inBound(r, c){
            return ( 0 <= c && c < cols && 0 <= r && r < rows )
        }

        return {board: board, pos: zerotils.sort((a, b) => {return 0.5 - Math.random()})[0]  }
    }

    aitoggle(){
        const history = this.state.history.slice();
        const current = history[this.state.step];

        let aimode = this.state.aimode
        if(!current.gameover){ 
            this.agent.active = !this.agent.active 
            
            //alert('ai start')
            this.agent.setup(current)
            let act = this.agent.getAction(-1)
            
            this.agentAct = act.action
            this.agentX = act.tile.x
            this.agentY = act.tile.y

            setTimeout(() => {
                if(act.action == 'UNCOVER'){
                    this.uncoverClick(current.board[act.tile.x][act.tile.y])
                }
                else if(act.action == 'FLAG'){
                    this.flagClick(current.board[act.tile.x][act.tile.y])
                }
                else{
                    //alert(this.agent.actionQueue.length)
                }
            }, this.pause);

        }

        this.setState({aimode: !aimode})
    }

    undo(){
        //alert('undo')
        let step = this.state.step
        if(step === 1) return
        this.setState({step: --step})
    }
    
    redo(){
        //alert('undo')
        let step = this.state.step
        if(step === this.state.history.length-1) return
        this.setState({step: ++step})
    }

    restart(){
        //alert('restart')]
        let rows = this.state.rows
        let cols = this.state.cols
        let mines = this.state.mines
        let mode = this.state.aimode
        let start = this.generateBoard(rows, cols, mines)

        this.setState({history: [{
                            flag: mines,
                            cover: rows*cols-mines,
                            board: start.board,
                            gameover: false,
                        }],
                        step: 0,
                        rows: rows,
                        cols: cols,
                        mines: mines,
                        start: start.pos,
                        aimode: mode,
                    })

        this.agent = new AI({rows: rows, cols: cols, mines: mines, start: start.pos})
        this.agentX = start.pos.x
        this.agentY = start.pos.y
        this.agentAct = 'UNCOVER'

        this.RESTART = true
    }

    uncoverClick(tile){
        if(tile.flag || tile.uncover) return

        const step = this.state.step
        const history = this.state.history.slice()
        let next = JSON.parse(JSON.stringify(history[step]))

        next.board[tile.x][tile.y].uncover = true
        next.cover--

        if(tile.mine){
            //alert('BOOOOM!')
            next.gameover = true
        }
        else if(tile.number === 0 && !this.state.aimode){
            this.dfsUncover(next, tile)
        }

        this.actionCenter(next)
    }

    flagClick(tile){
        if(tile.uncover) return

        const step = this.state.step
        const history = this.state.history.slice()
        let next = JSON.parse(JSON.stringify(history[step]))

        if(tile.flag){
            next.board[tile.x][tile.y].flag = false
            next.flag++
        }
        else{
            if(next.flag === 0){
                alert('no flag left!')
                return
            }
            next.board[tile.x][tile.y].flag = true
            next.flag--
        }
        
        this.actionCenter(next)
    }

    actionCenter(next){
        let step = this.state.step;
        let history = this.state.history.slice();

        // win game
        if(next.flag === 0 && next.cover === 0) next.gameover = true;

        if(next.gameover){
            //alert('game over')
            
        }

        // update history stream
        if(step == history.length-1) history.push(next);
        else{ 
            history[step + 1] = next;
            history.splice(step + 2);
        }
        
        // set state
        this.setState({history: history, step: ++step});
    }

    openBoard(){
        const step = this.state.step
        const history = this.state.history.slice()
        let next = JSON.parse(JSON.stringify(history[step]))

        next.flag = 0
        for(let i=0; i<this.state.rows; i++){
            for(let j=0; j<this.state.cols; j++){
                let t = next.board[i][j]
                if(!t.uncover){
                    if(!t.flag) t.uncover = true
                    else if(!t.mine){
                        t.flag = false
                        t.uncover = true
                    }
                }
            }
        }

        this.actionCenter(next)
    }

    dfsUncover(next, tile){
        let board = next.board
        DIR.forEach(d => {
            let nr = tile.x + d[0]
            let nc = tile.y + d[1]
            if(this.inBound(nr, nc) && !board[nr][nc].uncover && !board[nr][nc].flag){
                board[nr][nc].uncover = true
                next.cover--
                if(board[nr][nc].number === 0) 
                    this.dfsUncover(next, board[nr][nc])
            }
                
        })
    }

    inBound(r, c){
        return ( 0 <= c && c < this.state.cols && 0 <= r && r < this.state.rows )
    }

    render() {
        const history = this.state.history.slice();
        const current = history[this.state.step];
        let active = true
        if(this.state.aimode && this.agent.active) active = false
        return (
            <div className = "Game">
                <Control  undo = {this.undo} redo = {this.redo} restart = {this.restart} flags_left = {current.flag}
                            aimode = {this.state.aimode} toggle = {this.aitoggle} active = {active}/>
                <Board value = {current.board} uncov_callback = {this.uncoverClick} flag_callback = {this.flagClick}/>
                <AIinfo value = {this.agent.info}/>
            </div>
        )
    }

    componentDidMount(){
        this.uncoverClick(this.state.start)

        const history = this.state.history.slice();
        const current = history[this.state.step];
        if(this.state.aimode){
            let act = this.agent.getAction(current.board[this.agentX][this.agentY].number)
            this.agentAct = act.action
            this.agentX = act.tile.x
            this.agentY = act.tile.y
            setTimeout(() => {
                this.uncoverClick(current.board[act.tile.x][act.tile.y])
            }, this.pause);
        }
        
    }
    
    componentDidUpdate(){

        const history = this.state.history.slice();
        const current = history[this.state.step];

        if(this.RESTART){
            this.uncoverClick(this.state.start)
            this.RESTART = false
        }

        // ai mode
        if(this.agent.active){

            let act
            if(this.agentAct == 'FLAG'){
                act = this.agent.getAction(-1)
            }
            else{
                act = this.agent.getAction(current.board[this.agentX][this.agentY].number)
            }

            this.agentAct = act.action
            this.agentX = act.tile.x
            this.agentY = act.tile.y

            setTimeout(() => {
                if(act.action == 'UNCOVER'){
                    this.uncoverClick(current.board[act.tile.x][act.tile.y])
                }
                else if(act.action == 'FLAG'){
                    this.flagClick(current.board[act.tile.x][act.tile.y])
                }
                else{
                    //alert(this.agent.actionQueue.length)
                }
            }, this.pause);
        }

        // manual mode
        else{
            if(this.state.step === 0) 
                this.uncoverClick(this.state.start)
        }

        if(current.gameover) ;//alert('BOOOOOOM!')
        if(current.cover === 0 && current.flag === 0) ;//alert('You win !')
    }
}

class Control extends Component {
    render() {
        let active = this.props.active
        return (
            <div className = "Control">  
                    <div>
                        <Toggle label="AI" checked={this.props.aimode} onToggle={this.props.toggle} disabled = {!active}/>
                    </div>    
                    <div>
                        <ButtonGroup>
                        <Button onClick = {this.props.restart} disabled = {!active}> <img src={New} /> </Button>
                        <Button onClick = {this.props.undo} disabled = {!active}> <img src={Undo} />  </Button>
                        <Button onClick = {this.props.redo} disabled = {!active}> <img src={Redo} />  </Button>
                        </ButtonGroup>
                    </div>
                    <div>
                        Mines: {this.props.flags_left}
                    </div>
            </div>
        )
    }
}

class AIinfo extends Component {
    render() {
        let info = this.props.value
        return (
            <div>
                <p>prob = {info.prob}, unexp_mines = {info.unexp_mines}, unexp_tiles = {info.unexp_tiles}</p>
                <p>edgeTiles = {info.edgeTiles}</p>
                <p>min = {info.min}, ({info.min_tile.x}, {info.min_tile.y})</p>
            </div>
        )
    }
}

export default Game;
