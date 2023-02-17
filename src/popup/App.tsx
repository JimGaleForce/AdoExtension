import Highlight from './highlight';

const App = (): JSX.Element => {
  return (
    <div className='min-h-full'>
      <div className="border-b bg-slate-800 border-slate-600 pb-2">
        <h3 className="pl-2 pt-2 text-lg font-medium leading-6 text-white">ADO Powertools</h3>
      </div>
      <div className='p-2 bg-slate-100 min-h-full'>
        <Highlight/>
      </div>
    </div>
  )
}

export default App
