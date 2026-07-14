import {useEffect} from 'react'


function TestComponent() {

  console.log(Date.now()-window.start);
  useEffect(()=>{
    console.log(Date.now()-window.start);
  });

  return (
    <>
        <button
          type="button"
          className="counter"
        >
        Test
        </button>


    </>
  )
}

export default TestComponent
