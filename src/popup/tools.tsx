import { RenumberBacklogAction } from "../models/actions";

const Tools = (): JSX.Element => {
    const renumberBacklog = async () => {
        const action: RenumberBacklogAction = { action: 'RenumberBacklog' }
        chrome.runtime.sendMessage(action, (resp) => { });
    }

    return (
        <form className="mt-4 space-y-4 divide-y divide-gray-200">
            <div className="space-y-4">
                <button
                    className={
                        "pl-3 w-full pr-3 rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-2"
                    }
                    onClick={() => renumberBacklog().then(() => window.close())}
                >
                    Renumber backlog scenarios
                </button>
            </div>
        </form>
    );
}

export default Tools
