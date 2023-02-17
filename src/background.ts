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

const loadLatestIteration = async () => {
  const config = await loadConfig();

  const iterationsJson = await GetIterations(config, true);
  const currentIterationId = iterationsJson.value[0].id;

  const itemsJson = await GetItemsFromIteration(config, currentIterationId);
  const currentItemIds = itemsJson.workItemRelations.map((item: any) => item.target.id);

  const data = await chrome.storage.sync.get([currentIterationId]);
  const pastItemIds = data[currentIterationId] ?? [];

  // Remove duplicate item ids and then store.
  chrome.storage.sync.set({[currentIterationId]:[...new Set(currentItemIds.concat(pastItemIds))]});
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
  if (message.action === "iterationSummary") { 
    let summary = await SummaryForIteration(message.iterationId)
    sendResponse(summary);
    if (sender.tab?.id) {
      await chrome.tabs.sendMessage(sender.tab.id, {
        summary: summary
      }); 
    }
  }
});

loadLatestIteration();
