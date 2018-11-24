import React, { Component } from 'react';

import AI from './AI.js'
import Board from './Components/Board.js'
import Control from './Components/Control.js'
import './Game.css';

const DIR = [     [-1, 1], [-1, 0], [-1, -1],
                    [0, 1],          [0, -1],
                    [1, 1], [1, 0], [1, -1] ];

class Game extends Component {

    rows = 16
    cols = 16
    mines = 40 

    pause = 10

    agent
    agentX = 0
    agentY = 0
    agentAct = 'UNCOVER'

    RESTART = false

    constructor(props){
        super(props)
        let start = this.generateBoard()

        this.state = {
            history: [{
                flag: this.mines,
                cover: this.rows*this.cols-this.mines,
                board: start.board,
                gameover: false,
            }],
            step: 0,
            start: start.pos,
            aimode: false,
        }

        this.uncoverClick = this.uncoverClick.bind(this)
        this.flagClick = this.flagClick.bind(this)
        this.undo = this.undo.bind(this)
        this.redo = this.redo.bind(this)
        this.restart = this.restart.bind(this)
        this.aitoggle = this.aitoggle.bind(this)
        this.level = this.level.bind(this)

        this.agent = new AI({rows: this.rows, cols: this.cols, mines: this.mines, start: start.pos})
        this.agentX = start.pos.x
        this.agentY = start.pos.y
        this.agentAct = 'UNCOVER'
        this.agent.active = false;
    }

    generateBoard(){
        let rows = this.rows
        let cols = this.cols
        let mines = this.mines

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

    level(level){
        if(level === 1){
            this.rows = 10
            this.cols = 10
            this.mines = 10
        }
        else if(level === 2){
            this.rows = 16
            this.cols = 16
            this.mines = 40
        }
        else if(level === 3){
            this.rows = 16
            this.cols = 30
            this.mines = 99
        }
        this.restart()
    }

    aitoggle(){
        const history = this.state.history.slice();
        const current = history[this.state.step];

        let aimode = this.state.aimode
        if(!current.gameover && !aimode){ 
            this.agent.active = true //!this.agent.active 
            
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
        let mode = this.state.aimode
        let start = this.generateBoard()

        this.setState({history: [{
                            flag: this.mines,
                            cover: this.rows*this.cols-this.mines,
                            board: start.board,
                            gameover: false,
                        }],
                        step: 0,
                        start: start.pos,
                        aimode: mode,
                    })

        this.agent = new AI({rows: this.rows, cols: this.cols, mines: this.mines, start: start.pos})
        this.agentX = start.pos.x
        this.agentY = start.pos.y
        this.agentAct = 'UNCOVER'
        if(!mode) this.agent.active = false;
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
        for(let i=0; i<DIR.length; i++){
            let nr = tile.x + DIR[i][0]
            let nc = tile.y + DIR[i][1]

            if(this.inBound(nr, nc) && !board[nr][nc].uncover && !board[nr][nc].flag){
                board[nr][nc].uncover = true
                next.cover--
                if(board[nr][nc].number === 0) 
                    this.dfsUncover(next, board[nr][nc])
            }
                
        }
    }

    inBound(r, c){
        return ( 0 <= c && c < this.cols && 0 <= r && r < this.rows )
    }

    render() {
        const history = this.state.history.slice();
        const current = history[this.state.step];
        let active = true
        if(this.state.aimode && this.agent.active) active = false
        return (
            <div className = "Game">
                <Control  undo = {this.undo} redo = {this.redo} restart = {this.restart} flags_left = {current.flag}
                            aimode = {this.state.aimode} toggle = {this.aitoggle} level = {this.level} active = {active}/>
                <Board value = {current.board} uncov_callback = {this.uncoverClick} flag_callback = {this.flagClick}/>
                <div className = "game-status">
                    Mines: {current.flag}
                </div>
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

        // ai mode
        if(this.agent.active){

            if(this.RESTART){
                this.uncoverClick(this.state.start)
                this.RESTART = false
            }

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
            if(this.RESTART || this.state.step === 0){ 
                this.uncoverClick(this.state.start)
                this.RESTART = false
            }
        }

    }
}

// class AIinfo extends Component {
//     render() {
//         let info = this.props.value
//         return (
//             <div>
//                 <p>prob = {info.prob}, unexp_mines = {info.unexp_mines}, unexp_tiles = {info.unexp_tiles}</p>
//                 <p>edgeTiles = {info.edgeTiles}</p>
//                 <p>min = {info.min}, ({info.min_tile.x}, {info.min_tile.y})</p>
//             </div>
//         )
//     }
// }

export default Game;
