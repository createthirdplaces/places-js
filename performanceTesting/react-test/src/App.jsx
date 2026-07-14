import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

import TestComponent from './TestComponent'

function App() {
  const [count, setCount] = useState(0)

  window.start = Date.now();

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
