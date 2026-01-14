
chrome.commands.onCommand.addListener(async function(command) {
  console.log('command:', command);

  const currentTab = await getCurrentTab();
  if (!currentTab) {
    console.error('No active tab found');
    return;
  }

  const selectedText = await getSelectedText(currentTab);
  if (!selectedText) {
    console.error('No selected text found');
    return;
  }

  await chrome.search.query({
    text: selectedText,
    disposition: 'NEW_TAB',
  });
});

async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});

  if (tabs.length === 0) {
    console.error('No active tab found');
    return undefined;
  }

  return tabs[0];
}

async function getSelectedText(tab: chrome.tabs.Tab): Promise<string | undefined> {
  if (!tab) {
    console.error('Param tab is undefined');
    return undefined;
  }

  // Get selected text
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id!, allFrames: false },
    func: function() {
      const selectedText = window.getSelection?.() ?? document.getSelection?.() ?? '';
      const cleanedSelectedText = String(selectedText).replace(/\r?\n|\r/g, ' '); // Replace line breaks with spaces
      return encodeURIComponent(cleanedSelectedText);
    }
  });

  if (results.length === 0) {
    console.error('[Failed] executeScript() returns empty array', 'results:', results);
    return undefined;
  }

  const searchTextEncoded = results[0].result;

  if (!searchTextEncoded) {
    console.error('[InvalidResult] executeScript() returns:', searchTextEncoded);
    return undefined;
  }

  console.log('[Success] executeScript() returns encoded', `"${searchTextEncoded}"`);

  const searchText = decodeURIComponent(searchTextEncoded);

  if (!searchText){
    console.error('[InvalidResult] decodeURIComponent() returns:', searchText);
    return undefined;
  }

  console.log('[Success] decodeURIComponent() returns:', searchText);

  return searchText;
}
