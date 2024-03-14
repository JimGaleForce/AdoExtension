declare var dataProviders: any;

function waitFirst() {
    if (!dataProviders?.sharedData?._features) {
        window.setTimeout(waitFirst, 100);
        return;
    }

    document.dispatchEvent(new CustomEvent('getIsNewAdoHub',
    {
      detail: dataProviders.sharedData._features["ms.vss-work-web.new-boards-hub-feature"] === true
    }));
}

waitFirst();