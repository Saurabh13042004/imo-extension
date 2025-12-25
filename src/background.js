// IMO AI Shopping Assistant - Background Script

console.log("IMO Extension: Background script loaded.");

// CONFIGURATION
// CONFIGURATION
const BACKEND_API_URL = "https://informedmarketopinions.com/api/v1/utils/extract-search-query";

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

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyze_content") {
        console.log("IMO Extension: Received analysis request.");

        // We must return true to indicate we will send a response asynchronously
        handleAnalysis(request.content, sender.tab ? sender.tab.url : null).then(sendResponse);
        return true;
    }
});

async function handleAnalysis(content, url) {
    try {
        const response = await fetch(BACKEND_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: content,
                url: url
            })
        });

        const data = await response.json();

        if (data.redirectUrl) {
            console.log("IMO Extension: Backend returned redirect URL:", data.redirectUrl);
            return { redirectUrl: data.redirectUrl };
        } else {
            console.error("IMO Extension: Unexpected Backend response:", data);
            return { redirectUrl: null, error: "Invalid response from backend" };
        }

    } catch (error) {
        console.error("IMO Extension: Error calling Backend API:", error);
        return { redirectUrl: null, error: error.message };
    }
}
