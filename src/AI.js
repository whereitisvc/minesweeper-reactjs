const DIR = [     [-1, 1], [-1, 0], [-1, -1],
                    [0, 1],          [0, -1],
                    [1, 1], [1, 0], [1, -1] ];

class Tile{
    x = 0
    y = 0
    number = 0
    flag = false
    uncovered = false
    visited = false

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    setXY(x, y){
        this.x = x;
        this.y = y;
    }

    static neighbor(t1, t2){
        let dist = Math.abs(t1.x - t2.x) + Math.abs(t1.y - t2.y);
        if(dist > 2) return false
        else if(dist === 2){
            let x = Math.abs(t1.x - t2.x)
            let y = Math.abs(t1.y - t2.y)
            if(x === 2 || y === 2) return false
        }
        return true
    }

    static local(t1, t2){
        let dist = Math.abs(t1.x - t2.x) + Math.abs(t1.y - t2.y);
        if(dist > 3) return false
        else if(dist === 3){
            let x = Math.abs(t1.x - t2.x)
            let y = Math.abs(t1.y - t2.y)
            if(x === 3 || y === 3) return false
        }
        return true
    }

}

class AI{

    // preception
    board

    // variables
    rows
    cols
    remain_mines
    remain_tiles

    active = true
    agentXY = new Tile(0, 0)
    last_action

    CLOSE = false

    // list, set
    actionQueue = []
    zeroTiles = []
    edgeTiles = []
    history = []

    CLOSE_GAME_THRESHOLD = 7

    // info props
    info = {prob: -1, unexp_mines: -1, unexp_tiles: -1, edgeTiles: -1,
            min: -1, min_tile: new Tile(-1, -1)}

    constructor(props){
        this.board = this.generateBoard(props.rows, props.cols)
        this.rows = props.rows
        this.cols = props.cols
        this.remain_mines = props.mines
        this.remain_tiles = props.rows * props.cols - 1

        this.last_action = 'UNCOVER'
        this.agentXY = this.board[props.start.x][props.start.y]
        this.board[props.start.x][props.start.y].uncovered = true
        
        this.uncoverNeighbor(this.agentXY)
        
    }

    generateBoard(rs, cs){
        let ary = Array(rs*cs).fill(0).map((val, idx) => {
            return new Tile(0, 0)
        })

        let board = []
        while(ary.length) board.push(ary.splice(0,cs))

        for(let i=0; i<rs; i++){
            for(let j=0; j<cs; j++){
                board[i][j].setXY(i, j)
            }
        }

        return board
    }

    setup(current){
        this.rows = current.board.length
        this.cols = current.board[0].length
        this.board = this.generateBoard(this.rows, this.cols)
        this.remain_mines = current.flag
        this.remain_tiles = current.cover + current.flag

        this.active = true

        this.actionQueue = []
        this.zeroTiles = []
        this.edgeTiles = []
        this.history = []
        this.CLOSE = false
        this.last_action = 'DUMMY'

        let rows = this.rows
        let cols = this.cols

        function inEdge(i, j){
            for(let k=0; k<DIR.length; k++){
                let ni = i + DIR[k][0]
                let nj = j + DIR[k][1]
                if(inBound(ni, nj)){
                    let ctile = current.board[ni][nj]
                    if(!ctile.uncover && !ctile.flag) return true
                }
            }
            return false
        }

        function inBound(r, c){
            return ( 0 <= c && c < cols && 0 <= r && r < rows )
        }

        for(let i=0; i<rows; i++){
            for(let j=0; j<cols; j++){
                let ctile = current.board[i][j]
                if(!ctile.flag && !ctile.uncover) continue
                if(ctile.flag){
                    this.board[i][j].flag = true
                    this.board[i][j].number = ctile.number
                    this.board[i][j].visited = true
                    this.history.push(this.board[i][j])
                }
                else{
                    if(inEdge(i, j)){
                        if(ctile.number === 0) this.zeroTiles.push(this.board[i][j])
                        else this.edgeTiles.push(this.board[i][j])
                    }
                    this.board[i][j].uncovered = true
                    this.board[i][j].number = ctile.number
                    this.history.push(this.board[i][j])
                }
            }
        }
    }

    getInfo(){
        return this.info
    }

    getAction(number){

        if(this.CLOSE){
            console.log('closee')
        }

        /*********  precept the response from the environment *************/ 
        if(this.last_action === 'UNCOVER' && !this.agentXY.uncovered){
            if(number === -1){ 
                this.active = false
                return {action: 'LEAVE', tile: this.agentXY}
            }
            this.remain_tiles--
            this.agentXY.uncovered = true
            this.agentXY.number = number
            if(number === 0) this.zeroTiles.push(this.agentXY)
            else this.edgeTiles.push(this.agentXY)
        }

        if(this.last_action === 'FLAG' && !this.agentXY.flag){
            this.remain_tiles--
            this.remain_mines--
            this.agentXY.flag = true
            this.agentXY.number = number
            this.agentXY.visited = true
        }

        /*********  ai *************/
        // in case doing the same action multiple times
        while( this.actionQueue.length > 0 && this.history.indexOf(this.actionQueue[0].tile) > -1 ){
            this.actionQueue.splice(0, 1)
        }

        // Uncover the neighbor tiles of "zero" tile first
        if(this.actionQueue.length === 0){
            let size = this.zeroTiles.length
            this.zeroTiles.forEach(tile =>{
                this.uncoverNeighbor(tile)
            })
            this.zeroTiles.splice(0, size)
        }

        // Uncover/Flag the easy boundary tiles (can be easly inferred by one edge tile)
        if(this.actionQueue.length === 0){
            let blackList = []
            this.edgeTiles.forEach(tile =>{
                if(!this.checkBoundTiles(tile))
                    blackList.push(tile)
            })
            blackList.forEach(tile => {
                let idx = this.edgeTiles.indexOf(tile)
                if(idx > -1) 
                    this.edgeTiles.splice(idx, 1)
            })
            //console.log(this.actionQueue)
        }

        
        // Caculate all the configurations and make the best decision
        if(this.actionQueue.length === 0){
            
            let segment = []
            if(this.CLOSE) segment.push(this.edgeTiles)
            else segment = this.edgeTilesSegment()

            let mine_stat = new Map()
            let total_min = 0
            for(let i=0; i<segment.length; i++){
                
                let props = {min_mine: Number.MAX_VALUE}
                let configs = this.findMinesConfig(segment[i], props)
                total_min += (props.min_mine === Number.MAX_VALUE) ? 0 : props.min_mine

                if(configs.length === 0) ; //alert('no config found')
                else if(configs.length === 1) this.setConfig(configs[0])
                else{
                    // caculate the possibility of mine for each edge tile
                    this.caculateMineStat(mine_stat, configs);

                    // check if have any 100% sure tile
                    this.act2SafeTilebyStat(mine_stat);
                }
            }

            // In this case, no 100% safe or 100% mine boundary tile. Make the best guess by probility
            if(this.actionQueue.length === 0){

                let correct = this.bestGuessbyStat(mine_stat, total_min, segment)
                if(!correct){
                    this.CLOSE = true
                    this.last_action = 'DUMMY'
                    return this.getAction(-1)
                }
            }
        }

        return this.popActionQueue()
    }

    unexplore(tile){
        if(tile.uncovered || tile.flag) return false
        for(let i=0; i<this.edgeTiles.length; i++)
            if(Tile.neighbor(this.edgeTiles[i], tile)) return false
        return true
    }

    bestGuessbyStat(mine_stat, total_min, seg){

        if(this.CLOSE){
            console.log('close')
        }

        // get the bound tile with smallest prob
        let min = Number.MAX_VALUE
        let min_tile
        mine_stat.forEach( (prob, tile) => {
            if(prob < min){
                min = prob
                min_tile = tile
            }
        })

        // closing game
        if(this.CLOSE){
            if(mine_stat.size > 0) this.actionQueue.push({action: 'UNCOVER', tile: min_tile})
            console.log('wait')
            return true
        }

        // caculate the unexplored area
        let unexp_mines = this.remain_mines - total_min; // the largest number of mines in unexplored area
        let unexp_tiles = []; // the tiles in unexplored area
        for(let i=0; i<this.rows; i++){
            for(let j=0; j<this.cols; j++){
                if(this.unexplore(this.board[i][j])){
                    unexp_tiles.push(this.board[i][j])
                }
            }
        }

        // game is finished
        if(mine_stat.size === 0 && unexp_tiles.length === 0) return true

        // no unexplored tile anymore, close game strategy
        if(unexp_tiles.length === 0){
            alert('closing game, total_min = ' + total_min )
            return false
        }

        // all unexplore tile is for sure       
        if(unexp_mines === 0){
            unexp_tiles.forEach(t => {
                this.actionQueue.push({action: 'UNCOVER', tile: t})
            })
            return true
        }
        if(unexp_tiles.length === unexp_mines){
            unexp_tiles.forEach(t => {
                this.actionQueue.push({action: 'FLAG', tile: t})
            })
            return true
        }      

        // no edge tile
        if(mine_stat.size === 0){
            alert('no edge tiles')
            let ri = Math.floor(Math.random() * unexp_tiles.length)
            this.actionQueue.push({action: 'UNCOVER', tile: unexp_tiles[ri]});
            return true
        }

        // unexplored area  vs  explored area
        let prob = unexp_mines / unexp_tiles.length

        // info
        this.info.prob = prob
        this.info.unexp_mines = unexp_mines
        this.info.unexp_tiles = unexp_tiles.length
        this.info.edgeTiles = this.edgeTiles.length
        this.info.min = min
        this.info.min_tile = min_tile

        if(prob < 0){
            console.log(seg.length)
            alert('prob < 0')
        }

        if(min <= prob){
            this.actionQueue.push({action: 'UNCOVER', tile: min_tile});
        }
        else{
            let ri = Math.floor(Math.random() * unexp_tiles.length)
            this.actionQueue.push({action: 'UNCOVER', tile: unexp_tiles[ri]})
        }

        return true
    }

    act2SafeTilebyStat(mine_stat){
        mine_stat.forEach((possbility, tile) => {
            if(possbility == 0) this.actionQueue.push({action: 'UNCOVER', tile: tile})
            if(possbility == 1) this.actionQueue.push({action: 'FLAG', tile: tile})
        })
    }

    caculateMineStat(mine_stat, configs){
        let possible_tiles = []
        for(let i=0; i<configs.length; i++){
            configs[i].forEach(act => {
                if(!mine_stat.has(act.tile)) mine_stat.set(act.tile, 0)
                if(act.action == 'FLAG'){
                    let val = mine_stat.get(act.tile)
                    mine_stat.set(act.tile, val+1)
                    
                    let idx = possible_tiles.indexOf(act.tile)
                    if(idx === -1) possible_tiles.push(act.tile)
                }
            })
        }

        for(let i=0; i<possible_tiles.length; i++){
            let t = possible_tiles[i]
            let val = mine_stat.get(t)
            let prob = val/configs.length
            mine_stat.set(t, prob)
        }
    }

    dfsMines(configs, config, area, props, index, flagged){
        if(flagged > this.remain_mines) return
        if(index === area.length){
            if(config.length > 0 && this.CLOSE && flagged !== this.remain_mines) return
            if(config.length > 0) {
                configs.push(config.slice());

                let count = 0;
                config.forEach( a =>{
                    if(a.action == 'FLAG') count++;
                })
                if(count < props.min_mine) props.min_mine = count;
            }
            return
        }

        let current_tile = area[index]
        let mines = 0
        let covered_tile = []
        DIR.forEach(d => {
            let nx = current_tile.x + d[0]
            let ny = current_tile.y + d[1]
            if(this.inBound(nx, ny)){
                if(this.board[nx][ny].flag) mines++
                else if(!this.board[nx][ny].uncovered && !this.board[nx][ny].visited){
                    covered_tile.push(this.board[nx][ny])
                }
            }
        })

        // check current config legal or not
        if(mines > current_tile.number) return
        if(mines + covered_tile.length < current_tile.number) return
        if(covered_tile.length === 0){ 
            this.dfsMines(configs, config, area, props, index+1, flagged)
            return
        }

        // caculate the number of mines need to be set
        let remain = current_tile.number - mines;
        let ary = Array(covered_tile.length).fill(0).map((v, i) => {
            if(i >= covered_tile.length-remain) return 1
            else return v
        })

        let permutations = this.getPermutation(ary)
        for(let k=0; k<permutations.length; k++){
            let perm = permutations[k]
            for(let i=0; i<perm.length; i++){
                let tile = covered_tile[i]
                if(perm[i] === 1){
                    config.push({action: 'FLAG', tile: tile})
                    tile.flag = true
                    tile.visited = true
                }
                else{
                    config.push({action: 'UNCOVER', tile: tile})
                    tile.visited = true
                }
            }
            this.dfsMines(configs, config, area, props, index+1, flagged+remain)
            for(let i=0; i<perm.length; i++){
                let tile = covered_tile[i]
                config.pop()
                tile.flag = false
                tile.visited = false
            }
        }
    }

    findMinesConfig(area, props){
        let configs = [];
        let config = [];
        //vector<pair<int, int>> edgTiles (area.begin(), area.end());
        this.dfsMines(configs, config, area, props, 0, 0);
        return configs;
    }

    setConfig(config){
        config.forEach(act =>{
            this.actionQueue.push(act)
        })
    }

    edgeTilesSegment(){
        if(this.edgeTiles.length === 0) return []

        let mapIdx = Array(this.edgeTiles.length)
        for(let i=0; i<this.edgeTiles.length; i++) mapIdx[i] = i

        let parent = Array(mapIdx.length)
        for(let i=0; i<mapIdx.length; i++) parent[i] = i

        for(let i=0; i<mapIdx.length-1; i++){
            for(let j=i+1; j<mapIdx.length; j++){
                if(i === j) continue 
                if( Tile.local(this.edgeTiles[i], this.edgeTiles[j]) ){

                    // merge two set
                    if(parent[i] < parent[j]) parent[j] = parent[i];
                    else parent[i] = parent[j];
                    
                }
            }
        }

        let groups = new Map()
        for(let i=0; i<parent.length; i++){
            let root = i
            while(root !== parent[root]) root = parent[root]
            if(!groups.has(root)){
                groups.set(root, [i])
            }
            else{ // need to check if map.get().push() work!
                groups.get(root).push(i)
            }
        }

        let iter = groups.values()
        let segment = []
        for(let i=0; i<groups.size; i++){
            let area = []
            iter.next().value.forEach( idx => {
                area.push(this.edgeTiles[idx])
            })
            segment.push(area)
        }
        
        return segment
        

        // let segment = []
        // this.edgeTiles.forEach( tile => {
        //     let found = false;
        //     for(let i=0; i<segment.length; i++){
        //         for(let j=0; j<segment[i].length; j++){
        //             if(Tile.neighbor(tile, segment[i][j])){ 
        //                 segment[i].push(tile);
        //                 found = true;
        //                 break;
        //             }
        //         }
        //         if(found) break;
        //     }
        //     if(!found) segment.push([tile]);
        // })
        // return segment
    }

    checkBoundTiles(tile){
        let number = tile.number
        let mines = 0
        let cover_tiles = []

        DIR.forEach(d => {
            let nx = tile.x + d[0]
            let ny = tile.y + d[1]
            if(this.inBound(nx, ny)){
                if(this.board[nx][ny].flag) mines++
                else if(!this.board[nx][ny].uncovered && !this.board[nx][ny].visited)
                    cover_tiles.push(this.board[nx][ny])
            }
        })

        let size = cover_tiles.length
        if(size === 0) // if have no covered bound tiles around the edge tile, discard it
            return false

        else if(mines === number){ // if all the boundary tiles are not mine for sure, do it right now
            cover_tiles.forEach(t => {
                this.actionQueue.push({action: 'UNCOVER', tile: t})
            })
        }
        else if(size + mines === number){ // if all the boundary tiles are mine for sure, do it right now
            cover_tiles.forEach(t => {
                this.actionQueue.push({action: 'FLAG', tile: t})
            })
        }

        return true
    }

    uncoverNeighbor(tile){
        DIR.forEach(d => {
            let nx = tile.x + d[0]
            let ny = tile.y + d[1]
            if(this.inBound(nx, ny) && !this.board[nx][ny].visited && !this.board[nx][ny].uncovered){
                this.board[nx][ny].visited = true
                this.actionQueue.push({action: 'UNCOVER', tile: this.board[nx][ny]})
            }
        })
    }

    popActionQueue(){
        //alert(this.actionQueue.length)
        if(this.actionQueue.length === 0){ 
            this.active = false
            return {action: 'LEAVE', tile: this.agentXY}
        }

        let act = this.actionQueue[0]
        this.last_action = act.action
        this.agentXY = act.tile
        this.history.push(act.tile)

        this.actionQueue.splice(0, 1)
        return act
    }

    getPermutation(ary){

        function nextPermutation(array) {
            // Find non-increasing suffix
            var i = array.length - 1;
            while (i > 0 && array[i - 1] >= array[i])
                i--;
            if (i <= 0)
                return false;
            
            // Find successor to pivot
            var j = array.length - 1;
            while (array[j] <= array[i - 1])
                j--;
            var temp = array[i - 1];
            array[i - 1] = array[j];
            array[j] = temp;
            
            // Reverse suffix
            j = array.length - 1;
            while (i < j) {
                temp = array[i];
                array[i] = array[j];
                array[j] = temp;
                i++;
                j--;
            }
            return true;
        }

        let list = [ary.slice()]
        while(nextPermutation(ary)){ 
            list.push(ary.slice())
        }
        
        return list
    }

    inBound(r, c){
        return ( 0 <= c && c < this.cols && 0 <= r && r < this.rows )
    }
}

export default AI;