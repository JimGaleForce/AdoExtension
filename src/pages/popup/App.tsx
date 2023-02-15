import React from 'react'
import Highlight from './highlight';

const tabs = [
  { name: 'ADO Highlighter', href: '#', current: true },
  { name: 'Settings', href: '#', current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const App = (): JSX.Element => {
  return (
    <div>
      <div className="border-b border-gray-200 pl-4 pr-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <a
              key={tab.name}
              href={tab.href}
              className={classNames(
                tab.current
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
              )}
              aria-current={tab.current ? 'page' : undefined}
            >
              {tab.name}
            </a>
          ))}
        </nav>
      </div>
      <div className='my-2'>
        <Highlight/>
      </div>
    </div>
  )
}

export default App
