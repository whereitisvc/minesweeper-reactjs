import React, { Component } from 'react';
import Game from './Game';
import './App.css';
//import './bootstrap.css'
//import './scrolling-nav.css'
import Navbar from "./Components/Navbar";
import Section from "./Components/Section";

class App extends Component {
  render() {
    
    return (
      <div className='App'>

        <Navbar />

        <section id="section1" className = "section-game">
          <Game />
        </section>  

        <Section
          title="Description"
          dark={false}
          id="section2"
        />

        <Section
          title="Conclusion & Credit"
          dark={false}
          id="section3"
        />

      </div>
    )
  }
}

export default App;
