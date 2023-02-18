import { useEffect } from "react"
// import { IterationSummary } from "../../models/adoSummary";

const App = (): JSX.Element => {

  const onMessage = async (request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log("Got response");
    console.log(request);
    // const summary = request.summary as IterationSummary;
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener(onMessage)
  }, [])

  return (
    <div className='min-h-full'>
      <div className="border-b bg-slate-800 border-slate-600 pb-2">
        <h3 className="pl-2 pt-2 text-lg font-medium leading-6 text-white">ADO Powertools - Summary</h3>
      </div>
      <div className='p-2 bg-slate-100 min-h-full'>
        {/* <Config/> */}
        Hello world
      </div>
    </div>
  )
}

export default App


