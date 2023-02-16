import { SummaryForIteration } from "./ado/summary";
import { GetItemsFromIteration, GetIterations } from "./ado/api";
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

chrome.alarms.create(
  {
    periodInMinutes: 0.5 // for testing purposes only
    //periodInMinutes: 360 // once every 6 h
  }
)

chrome.alarms.onAlarm.addListener(
  async function(alarm) {
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
)

// Temporary code. Need to reference this function so that the file gets watched.
if (false) {
  SummaryForIteration("fake-iteration-id");
}