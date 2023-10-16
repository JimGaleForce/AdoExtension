import { useState } from 'react';
import Config from './config';
import Report from './report';
import Tabs from './tabs';

const tabs = [
 "Report",
 "Config"
]

const App = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  return (
    <div className='min-h-full min-w-[265px]'>
      <div className="border-b bg-slate-800 border-slate-600 pb-2">
        <h3 className="pl-2 pt-2 text-lg font-medium leading-6 text-white">ADO Power Tools</h3>
      </div>
      <div className='p-2 bg-slate-100 min-h-full'>
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "Report" && (<Report/>)}
        {activeTab === "Config" && (<Config/>)}
      </div>
    </div>
  )
}

export default App
