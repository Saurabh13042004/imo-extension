// IMO AI Shopping Assistant - Background Script

console.log("IMO Extension: Background script loaded.");

// Listen for the extension icon click
chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        console.log("IMO Extension: Icon clicked. Sending message to tab", tab.id);
        chrome.tabs.sendMessage(tab.id, { action: "activate_imo_ui" }).catch((error) => {
            console.warn("IMO Extension: Could not send message to tab. Content script might not be loaded.", error);
            // Optional: Inject script if not loaded (requires 'scripting' permission)
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["src/content.js"]
            });
        });
    }
});
