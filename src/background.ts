import { GetBatchItemDetails, GetItemsFromIteration, GetIterations } from "./ado/api";
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
    const itemIdsList = itemsJson.workItemRelations.map((item: any) => item.target.id);

    const itemsDetailsJson = await GetBatchItemDetails(config, itemIdsList);
    const itemDetails = itemsDetailsJson.value;
    console.log(itemDetails);
  }
)
