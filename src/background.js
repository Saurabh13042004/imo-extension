// IMO AI Shopping Assistant - Background Script

console.log("IMO Extension: Background script loaded.");

// CONFIGURATION
const BACKEND_API_URL = "https://informedmarketopinions.com/api/api/v1/utils/extract-search-query";

// Add logging to verify the URL being called
console.log("IMO Extension: API URL configured as:", BACKEND_API_URL);

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
        console.log("IMO Extension: Calling API with URL:", BACKEND_API_URL);
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

        console.log("IMO Extension: Response status:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("IMO Extension: HTTP Error:", response.status, errorText);
            return { redirectUrl: null, error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        console.log("IMO Extension: Backend response data:", data);

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
