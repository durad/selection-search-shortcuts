
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
      return encodeURIComponent(selectedText as string);
    }
  });

  if (results.length === 0) {
    console.error('[Failed] executeScript() returns empty array', 'results:', results);
    return undefined;
  }

  const selectedTextEncoded = results[0]?.result;

  if (!selectedTextEncoded) {
    console.error('[InvalidResult] executeScript() returns:', selectedTextEncoded);
    return undefined;
  }

  const selectedText = decodeURIComponent(selectedTextEncoded);

  return selectedText;
}

chrome.commands.onCommand.addListener(async function(command) {
  console.log('command:', command);

  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!currentTab) {
    console.error('No active tab found');
    return;
  }

  const selectedText = await getSelectedText(currentTab);
  if (!selectedText) {
    console.error('No selected text found');
    return;
  }

  // Open empty tab, run search and only then focus on it.
  // This way there is no flicker and focus ends up being on the page and not the omnibox.
  const newTab = await chrome.tabs.create({
    index: currentTab.index + 1,
    active: false,
  });

  await chrome.search.query({
    tabId: newTab.id!,
    text: selectedText,
  });

  await chrome.tabs.update(newTab.id!, { openerTabId: currentTab.id!, active: true });
});

