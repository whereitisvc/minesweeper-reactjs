import React from "react";

import Toggle from "react-toggle-component"
import "react-toggle-component/styles.css"
import {Button, ButtonGroup, ButtonToolbar} from 'react-bootstrap/lib'
import {ToggleButton, ToggleButtonGroup} from 'react-bootstrap/lib'

import AItoggle from "./demo/AI-toggle.png";
import term from "./demo/term.png";
import stage2 from "./demo/stage2.png";
import stage3a from "./demo/stage3a.png";
import stage3b from "./demo/stage3b.png";
import stage3c from "./demo/stage3c.png";
import stage4a from "./demo/stage4a.png";
import stage4b from "./demo/stage4b.png";
import segment from "./demo/segment.png";
import close1 from "./demo/close1.png";
import close2 from "./demo/close2.png";
import github from "./demo/github.svg";

export default function Section({ title, subtitle, dark, id }) {
  
  let content = ''

  if(id === 'section2'){
    content = (<div>
    <p>This is a classic <a href="https://en.wikipedia.org/wiki/Minesweeper_(video_game)">Minesweeper</a> game 
    with an AI agent. You can turn on <div className="inline-component"><img src={AItoggle} width="70px"/></div> at any time in game, it will read the game board information and 
    automatically solve it with smart game strategies. There are three different difficulty modes you can choose:</p>
    <p><Button>Easy</Button> : 8 by 8 tiles with 10 mines. AI agent can solve it with 87.4% success rate</p>
    <p><Button>Medium</Button> : 16 by 16 tiles with 40 mines. AI agent can solve it with 84.7% success rate</p>
    <p><Button>Hard</Button> : 16 by 30 tiles with 99 mines. AI agent can solve it with 43.1% success rate</p>
    <p>The success rates are tested by 1000 random game boards in each difficulty. All the project are coded in 
     <a href="https://reactjs.org/"> React JS</a>, you can check out the source code <a href="https://github.com/whereitisvc/minesweeper-reactjs">here</a>.</p>
    

    <br/>
    <h1>How it works</h1>
    <p>There are mainly four strategies applied adaptively by AI agent. That means the more complex one will be applied only if the easier one fails (no move return). Before seeing those strategies, let us define the terms will be used in this article first:</p>
    <img src={term} width="50%"/>
    <p>Edge tiles are those uncovered tiles on the edge of our explored area. They provide the major information for solving puzzles. Boundary tiles are the covered tiles that immediately contact with edge tiles. They are the major candidates for the next move. Unexplored tiles are the rest of the covered tiles.</p>
    

    <br/>
    <h3>Stage 1: Uncover the neighbor of zero tiles</h3>
    <p>Zero tiles are the covered tiles which showing there are no mines surround them. We can use 
    <a href="https://en.wikipedia.org/wiki/Depth-first_search"> Depth First Search (DFS)</a> to uncover them recursively.
     It will automatically applied when you are playing manually.</p>
    

    <br/>
    <h3>Stage 2: Uncover/Flag the tiles by deduction</h3>
    <p>Here we check all the edge tiles surrounding to see if any boundary tile is or is not mines for sure. For example:</p>
    <img src={stage2} width="30%"/>
    <p>We can deduce the two boundary tiles are mines because there are two mines in the red square and they are the only two covered tiles.</p>

    <br/>
    <h3>Stage 3: Calculate all the configurations</h3>
    <p>Here, no easy tile can get. People who are new to Minesweeper might get stuck and try to uncover a tile randomly. However, 
    by more deeper deduction, we may get some confident moves in chance. For example: </p>
    <img src={stage3a} width="30%"/>
    <p>We can not get any answer by looking at only one edge tile. But when looking all the edge tiles together, we find 
    out there are only two possible configurations:</p>
    <div className = "img-block">
    <img src={stage3b} width="30%" height="30%"/>
    <img src={stage3c} width="30%" height="30%"/>
    </div>
    <p>In both possible configurations, the right four boundary tiles are the same, meaning that these tiles can be 
    uncovered/flagged for sure. Therefore, at this stage, our mission is to find out all the possible configurations 
    of the boundary tiles. AI agent uses DFS with <a href="https://en.wikipedia.org/wiki/Backtracking">Backtracking</a> 
     to accomplish this task.</p>
    

    <br/>
    <h3>Stage 4: Make the best guess by probability</h3>
    <p>At this stage, all the possible configurations have found but no boundary tile is safe. We have no choice but to make a guess. Fortunately, the configurations we found can help us to make a smart guess. By stating all the possible mine occurrence, we can get the mines occurrence probability  of each boundary tile. Then, uncover the boundary tile with the smallest probability can give us the biggest chance to go further. For example:</p>
    <img src={stage4a} width="40%"/>
    <p>We will choose one of the four boundary tiles with 0.25 probability to uncover instead of from all eight boundary tiles. </p>
    <p>Sometimes, uncover the unexplored tile is worth to try, especially when you are in the early game. With this viewpoint, we compare the probability in the boundary area and in the unexplored area before we make our final guess. If the probability of the unexplored area is smaller, than we uncover a random unexplored tile. Note that when calculating the mine occurrence probability of unexplored area, we need to know the smallest possible number of mines in boundary area (which can be attained from calculating configurations in stage 3) because we don't want to underestimate the probability in the unexplored area. Take the above board as an example, the smallest possible number of mines in the boundary area is two, hence, the probability in the unexplored area is (18 - 2) / 49 = 0.33:</p>
    <img src={stage4b} width="50%"/>
    <p>Where 18 is the remain mines in game and 49 is the number of unexplored tiles. In this case, AI agent still uncover the boundary tile because 0.25 is smaller, but if there are more unexplored tiles (probability will decrease) it may turn to randomly uncover one of the unexplored tiles. 
    </p><p>Note that if the probability of unexplored area equals to 1.00 doesn't mean all unexplored are mines for sure because we calculate the probability pessimistically (as high as possible). On the other hand, if the probability is equal to 0, then we can sure all unexplored tiles are safe. </p>


    <br/>
    <h3>Segmentation</h3>
    <p>When the game board becomes bigger, there might have several boundary areas which are independent. For example:</p>
    <img src={segment} width="80%"/>
    <p>We can see that whatever the configuration in the left boundary area will not affect the right boundary area. If we treat them as one area, the DFS tree for finding possible configurations becomes extremely inefficient. Moreover, the probability we calculated will become imprecise. Therefore, it is important to do the boundary area segmentation (AI agent runs DFS on edge tiles, so actually is doing edge tiles area segmentation) before calculating possible configurations. AI agent uses <a>Union Find</a> to accomplish this task.</p>

    <br/>
    <h3>Closing to the game end</h3>
    <p>Finally, there is one more strategy that can increase our guessing quality, especially when closing to the end of 
    the game. If there are no unexplored tile anymore, we can reject the possible configurations which set up 
    less number of mines than the game remaining mines, because all the mines are in boundary area. For example:</p>
    <img src={close2} width="50%"/>
    <p>The red stars are the mines in one of the possible configurations. However, only three mines left in game, we can 
    then reject this possible configuration.</p>

    </div>)
  }
  else if(id === 'section3'){
    content = (<div>
    <p>The strategies applied in this project are majorly credited to this article: 
    <i><a href="https://luckytoilet.wordpress.com/2012/12/23/2125/">"How to Write your own Minesweeper AI"</a></i>. 
    Please check it out if you are interested in more details. There are also lots of other Minesweeper solving 
    strategies worth to try. For example, <i><a href="https://massaioli.wordpress.com/2013/01/12/solving-minesweeper-with-matricies/comment-page-1/">
    "Solving Minesweeper with Matrices"</a></i> uses matrices to represent the information of the edge tiles and 
    boundary tiles and therefore can find out the possible configurations by reducing the equations. This method can 
    significantly improve the efficiency in contrast to DFS. Nevertheless, when comparing to the success rate, 
    I believe this project demonstrates a decent result. Finally, the source code of the project is available on Github. 
    Please feel free to check it out:</p>
    <br/>
    <a href="https://github.com/whereitisvc/minesweeper-reactjs"><img src={github} width="64px"/></a>
    <br/>
    <br/>
    <br/>
    <br/>

    </div>)
  }

  return (
    <div className={"section" + (dark ? " section-dark" : "")}>
      <div className="section-content" id={id}>
        <h1>{title}</h1>
        {content}
      </div>
    </div>
  );
}
