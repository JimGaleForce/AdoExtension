import { GetItemsFromIteration, GetIterations } from "./ado/api";
import { SummaryForIteration } from "./ado/summary";
import { loadConfig } from "./models/adoConfig";

var adoxChanged = true;

chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    if (message === 'adox-colors-updated') {
      adoxChanged = true;
    }
    if (message === 'adox-check') {
      var was = adoxChanged;
      adoxChanged = false;
      await sendResponse(was);
    }
    return true;
  }
);

const loadIteration = async (iterationId: string) => {
  const config = await loadConfig();
  const itemsJson = await GetItemsFromIteration(config, iterationId);
  const currentItemIds = itemsJson.workItemRelations.map((item: any) => item.target.id);

  const data = await chrome.storage.sync.get([iterationId]);
  const pastItemIds = data[iterationId] ?? [];

  // Remove duplicate item ids and then store.
  chrome.storage.sync.set({[iterationId]:[...new Set(currentItemIds.concat(pastItemIds))]});
}


const loadLatestIteration = async () => {
  const config = await loadConfig();

  const iterationsJson = await GetIterations(config, true);
  const currentIterationId = iterationsJson.value[0].id;

  loadIteration(currentIterationId);
}

chrome.alarms.create(
  {
    periodInMinutes: 1440 // once every day
  }
)

chrome.alarms.onAlarm.addListener(
  async function(alarm) {
    await loadLatestIteration();
  }
)

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const {action, iteration} = message;

  console.log("[2] here");
  if (!action || !iteration) {
    console.log("[3] here");
    return;
  }

  console.log("[4] here");
  if (action === "iterationSummary") {
    
    console.log("[5] here");
    const summaryTab = await chrome.tabs.create({
      active: true,
      url: `src/pages/summary/index.html?iteration=${iteration.id}`
    });

    await loadIteration(iteration.id);

    let summary = await SummaryForIteration(iteration.id)
    if (summaryTab.id) {
      chrome.tabs.sendMessage(summaryTab.id, { summary })
    }
  }
});

loadLatestIteration();