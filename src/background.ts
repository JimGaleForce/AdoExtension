import { GetBatchItemDetails, GetItemsFromIteration, GetIterations } from "./ado/api";

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
    //TODO: read these from the extension popup
    const organization = "";
    const project = "";
    const team = ""

    const iterationsJson = await GetIterations(organization, project, team, true);
    const currentIterationId = iterationsJson.value[0].id;

    const itemsJson = await GetItemsFromIteration(organization, project, team, currentIterationId);
    const itemIdsList = itemsJson.workItemRelations.map((item: any) => item.target.id);

    const itemsDetailsJson = await GetBatchItemDetails(organization, project, itemIdsList);
    const itemDetails = itemsDetailsJson.value;
    console.log(itemDetails);
  }
)
