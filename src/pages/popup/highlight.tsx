import React, { useEffect, useState } from 'react';

type AdoConfigData = {
    queryId: string
    colors: string[]
  }
  
  const baseConfig: AdoConfigData = {
    queryId: "",
    colors: [
      '#ccFFcc',
      '#FFFFcc',
      '#FFcccc',
      '#ccccFF',
      '#ccFFFF'
    ]
  }
const Highlight = (): JSX.Element => {
    const [adoxData, setAdoxData] = useState<AdoConfigData>(baseConfig);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);
  
    const saveConfig = async () => {
      await chrome.storage.sync.set({ adoxData });
      console.log("Saved config");
    }
  
    const resetConfig = async () => {
      setAdoxData(baseConfig);
      console.log("Config reset");
    }

    const onColorChanged = (index: number, color: string) => {
        var newData = {...adoxData};
        newData.colors[index] = color;
        setAdoxData(newData);
    }
  
    const onQueryChanged = (queryId: string) => {
        var newData = {...adoxData};
        newData.queryId = queryId;
        setAdoxData(newData);
    }

    // Load colors from storage
    useEffect(() => {
      chrome.storage.sync.get(['adoxData'])
      .then(data => {
        setAdoxData({...baseConfig, ...data.adoxData});
        setLoaded(true);
      })
      .catch(error => {
        setError(error);
      })
    }, [])
  
    if (error) {
      return (
        <div>
          Error loading data
        </div>
      )
    }
  
    if (!loaded) {
      return (
        <div>
          Loading...
        </div>
      )
    }
  
  return (
    <div>
        <div>Line Colors</div>
        <div>
            <div id="adox-colors">
                <input
                    type="color"
                    onChange={(e) => onColorChanged(0, e.target.value)}
                    value={adoxData.colors[0]}
                    className='w-16px h-20px border-none p-0'
                />
                <input
                    type="color"
                    onChange={(e) => onColorChanged(1, e.target.value)}
                    value={adoxData.colors[1]}
                    className='w-16px h-20px border-none p-0'
                />
                <input
                    type="color"
                    onChange={(e) => onColorChanged(2, e.target.value)}
                    value={adoxData.colors[2]}
                    className='w-16px h-20px border-none p-0'
                />
                <input
                    type="color"
                    onChange={(e) => onColorChanged(3, e.target.value)}
                    value={adoxData.colors[3]}
                    className='w-16px h-20px border-none p-0'
                />
                <input
                    type="color"
                    onChange={(e) => onColorChanged(4, e.target.value)}
                    value={adoxData.colors[4]}
                    className='w-16px h-20px border-none p-0'
                />
            </div>
            <br/>
            <div>Query ID</div>
            <div>
                <input className='w-100' type="text" value={adoxData.queryId} onChange={(e) => onQueryChanged(e.target.value)} />
            </div>
        </div>
        <div className='my-2'>
            <button className="adox-btn button-8" role="button" id="adox-save" onClick={() => saveConfig().then(() =>  window.close())}>Save</button>
            <button className="adox-btn button-8" role="button" id="adox-reset" onClick={() => resetConfig()}>Reset</button>
        </div>
    </div>
  );
}

export default Highlight