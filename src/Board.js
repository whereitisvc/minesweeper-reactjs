import React, { Component } from 'react';
import Flag from './icon/flag.svg'
import './Game.css';

class Tile extends Component {  

    render() {
        const tile= this.props.value;
        const preventDefault = (e) => { e.preventDefault() }
        const handleClick = (e) => {
            preventDefault(e)
            if(e.buttons === 1) this.props.uncov_callback(tile)
            else if(e.buttons == 2) this.props.flag_callback(tile)           
        }

        const colors = ["blue", "green", "red", "#000099", "brown", "#00e6e6n", "black", "grey"]
        let style = {}
        if(tile.uncover && tile.number > 0){
            style = {color: colors[tile.number-1], background: "rgb(170,145,145)"}
        }

        let tile_class = "Tile"
        if(!tile.uncover) tile_class += " cover"
        if(tile.uncover && tile.mine) tile_class += " mine"

        return (
            <button className = {tile_class} 
                style={style}
                onContextMenu={preventDefault} 
                onMouseDown = {handleClick} >
                    {(tile.flag) ? <img src={Flag} className="flag" alt="logo" /> : undefined }
                    {(tile.uncover) ? tile.number : undefined }
            </button>
        )
    }
}

class Board extends Component {

    render() {
        let board = this.props.value
        let rows = board.length
        //let cols = board[0].length

        let matrix = [];
        for(let i=0; i<rows; i++){
            matrix.push(
                <div>
                    {
                        board[i].map((val, idx) => {
                            return (<Tile key={idx} value={val} 
                                        uncov_callback = {this.props.uncov_callback} 
                                        flag_callback = {this.props.flag_callback}/>)
                        })
                    }
                </div>
            )
        }
        return (
            <div className = "Board">
                {matrix}
            </div>
        )
    }
}

export default Board;
