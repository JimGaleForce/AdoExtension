import React from "react"

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

interface Props {
    tabs: string[]
    activeTab: string
    setActiveTab: (tab: string) => void
}

const Tabs: React.FC<Props> = (props) => {
    const { tabs, activeTab, setActiveTab } = props;
    return (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            {tabs.map((tab) => (
              <a
                href="#"
                key={tab}
                className={classNames(
                  activeTab === tab
                    ? 'border-slate-600 text-slate-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'w-1/2 border-b-2 py-1 px-1 text-center text-sm font-medium'
                )}
                aria-current={activeTab === tab ? 'page' : undefined}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </a>
            ))}
          </nav>
        </div>
    )
};

export default Tabs;