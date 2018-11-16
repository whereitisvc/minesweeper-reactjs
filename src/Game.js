import React, { Component } from 'react';
import Toggle from "react-toggle-component"
import "react-toggle-component/styles.css"
import {Button, ButtonGroup} from 'react-bootstrap/lib'
import {Grid, Row, Col} from 'react-bootstrap/lib'

import Board from './Board.js'
import New from './icon/New.svg'
import Undo from './icon/Undo.svg'
import Redo from './icon/Redo.svg'
import './App.css';

const DIR = [     [-1, 1], [-1, 0], [-1, -1],
                    [0, 1],          [0, -1],
                    [1, 1], [1, 0], [1, -1] ];

class Game extends Component {

    constructor(props){
        super(props)
        let rows = 10
        let cols = 10
        let mines = 20      

        let start = this.generateBoard(rows, cols, mines)

        this.state = {
            history: [{
                flag: mines,
                cover: rows*cols,
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
        let mode = this.state.aimode
        this.setState({aimode: !mode})
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
                            cover: rows*cols,
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
    }

    uncoverClick(tile){
        if(tile.flag || tile.uncover) return

        const step = this.state.step
        const history = this.state.history.slice()
        let next = JSON.parse(JSON.stringify(history[step]))

        next.board[tile.x][tile.y].uncover = true
        next.cover--

        if(tile.mine){
            next.gameover = true
        }
        else if(tile.number === 0){
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
            next.cover++
        }
        else{
            if(next.flag === 0){
                alert('no flag left!')
                return
            }
            next.board[tile.x][tile.y].flag = true
            next.flag--
            next.cover--
        }
        
        this.actionCenter(next)
    }

    actionCenter(next){
        let step = this.state.step;
        let history = this.state.history.slice();

        if(next.gameover){
            alert('BOOOOM!')
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
        }

        if(next.cover === 0 && next.flag === 0){
            alert('You win !')
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
        return (
            <div className = "Game">
                <Control  undo = {this.undo} redo = {this.redo} restart = {this.restart} flags_left = {current.flag}
                            aimode = {this.state.aimode} toggle = {this.aitoggle} />
                <Board value = {current.board} uncov_callback = {this.uncoverClick} flag_callback = {this.flagClick}/>
            </div>
        )
    }

    componentDidMount(){
        this.uncoverClick(this.state.start)
    }
    
    componentDidUpdate(){
        if(this.state.step === 0) 
            this.uncoverClick(this.state.start)
    }
}

class Control extends Component {
    render() {
        return (
            <div className = "Control">  
                    <div>
                        <Toggle label="AI" checked={this.props.aimode} onToggle={this.props.toggle} />
                    </div>    
                    <div>
                        <ButtonGroup>
                        <Button onClick = {this.props.restart} > <img src={New} /> </Button>
                        <Button onClick = {this.props.undo} > <img src={Undo} />  </Button>
                        <Button onClick = {this.props.redo} > <img src={Redo} />  </Button>
                        </ButtonGroup>
                    </div>
                    <div>
                        Mines: {this.props.flags_left}
                    </div>
            </div>
        )
    }
}

export default Game;
