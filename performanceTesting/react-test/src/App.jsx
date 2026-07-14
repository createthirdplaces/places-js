import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'

import TestComponent from './TestComponent'

function App() {
  const [count, setCount] = useState(0)

  window.startTime = Date.now();

  let i = setInterval(function(){
    if(document.getElementsByTagName("button").length === 1000){
      console.log("Rendering time: "+(Date.now()-window.startTime)); 
      clearInterval(i);
    }
  },10);

  const data = [];
  
  for(let i =0;i<1000;i++){
    data.push(
      <TestComponent key={i}></TestComponent>
    )
  }
  
  return (
      <div>{data}</div>
  )
}

export default App
