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

loadLatestIteration();

// async function Test() {
//   console.log(`Summary for f35df25f-e9d5-46da-9c92-e100da93cf3f`);
//   SummaryForIteration('f35df25f-e9d5-46da-9c92-e100da93cf3f');
// }

// Test();
