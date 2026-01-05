// IMO AI Shopping Assistant - Content Script

console.log("IMO Extension: Content script loaded.");

// Configuration
const CONFIG = {
  redirectBaseUrl: "https://informedmarketopinions.com/search?q=",
  loadingDurationMin: 2000, // 2 seconds
  loadingDurationMax: 5000, // 5 seconds

  selectors: {
    productTitle: [
      "h1",
      "#productTitle",
      ".product-title",
      "[data-testid='product-title']",
      ".product_title"
    ]
  }
};

// State
let state = {
  productName: null,
  isActive: false,
  currentUrl: window.location.href
};

// Utils
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomDelay = () => Math.floor(Math.random() * (CONFIG.loadingDurationMax - CONFIG.loadingDurationMin + 1) + CONFIG.loadingDurationMin);

// Core Logic
function init() {
  checkUrlChange();
  console.log("IMO Extension: Initialized. Waiting for manual activation.");
}

function checkUrlChange() {
  setInterval(() => {
    if (window.location.href !== state.currentUrl) {
      console.log("IMO Extension: URL changed, resetting UI.");
      state.currentUrl = window.location.href;
      removeUI();
      // Re-run init to see if we should activate on the new page (for SPA)
      init();
    }
  }, 1000);
}

function attemptActivation() {
  const productName = extractProductName();
  if (productName) {
    console.log("IMO Extension: Product detected:", productName);
    state.productName = productName;
    injectUI();
  } else {
    // If auto-activating, we might want to be less aggressive if no product is found
    // But for now, we only inject if we find a product title or if manually triggered
    console.log("IMO Extension: No product detected.");
  }
}

function extractProductName() {
  for (const selector of CONFIG.selectors.productTitle) {
    const element = document.querySelector(selector);
    if (element && element.innerText.trim().length > 0) {
      return element.innerText.trim();
    }
  }
  return null;
}

function scrapePageContent() {
  // Get visible text from the body, limited to a reasonable amount
  // We prioritize h1, h2, meta descriptions, etc.
  const title = document.title;
  const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
  const h1s = Array.from(document.querySelectorAll('h1')).map(el => el.innerText).join(" ");
  const bodyText = document.body.innerText.substring(0, 5000); // Limit to 5000 chars

  return `Title: ${title}\nDescription: ${metaDesc}\nMain Headings: ${h1s}\nContent Snippet: ${bodyText}`;
}

function removeUI() {
  const container = document.getElementById('imo-container');
  if (container) {
    container.remove();
  }
}

function injectUI() {
  if (document.getElementById('imo-container')) return;

  const container = document.createElement('div');
  container.id = 'imo-container';

  // Shadow DOM to isolate styles
  const shadow = container.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .imo-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      width: 320px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.3s ease, opacity 0.3s ease;
      animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .imo-header {
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .imo-content {
      text-align: center;
      width: 100%;
    }

    /* Loading State */
    .loader {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }

    /* Result State */
    .result-text {
      font-size: 18px;
      font-weight: 700;
      color: #111;
      margin-bottom: 20px;
      line-height: 1.4;
    }

    .cta-button {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
    }

    .cta-button:active {
      transform: translateY(0);
    }

    .close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
    }

    .close-btn:hover {
      color: #000;
    }
    
    .card-header-container {
      position: relative;
      width: 100%;
    }
    
    .hidden {
      display: none;
    }
  `;

  const card = document.createElement('div');
  card.className = 'imo-card';
  card.style.position = 'relative';

  // Initial Loading HTML
  card.innerHTML = `
    <button class="close-btn" id="close-btn">✕</button>
    <div class="imo-header">IMO AI Assistant</div>
    <div class="imo-content" id="content-area">
      <div class="loader"></div>
      <div class="loading-text">Analyzing product details...</div>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(card);
  document.body.appendChild(container);

  // Add close button listener
  const closeBtn = shadow.getElementById('close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeUI();
    });
  }

  // Start the logic flow
  handleLogic(shadow);
}

async function handleLogic(shadowRoot) {
  const contentArea = shadowRoot.getElementById('content-area');

  // 1. Scrape content
  const pageContent = scrapePageContent();

  // 2. Send to Background for Analysis
  try {
    const response = await chrome.runtime.sendMessage({
      action: "analyze_content",
      content: pageContent
    });

    if (response && response.redirectUrl) {
      state.redirectUrl = response.redirectUrl;
    } else {
      console.warn("IMO Extension: Backend analysis failed or returned no URL. Using fallback.");
      // Fallback: try to extract product name locally and construct URL
      const fallbackName = extractProductName();
      if (fallbackName) {
        state.redirectUrl = `${CONFIG.redirectBaseUrl}${encodeURIComponent(fallbackName)}`;
      } else {
        state.redirectUrl = "https://informedmarketopinions.com/"; // Ultimate fallback
      }
    }
  } catch (error) {
    console.error("IMO Extension: Error communicating with background script:", error);
    const fallbackName = extractProductName();
    if (fallbackName) {
      state.redirectUrl = `${CONFIG.redirectBaseUrl}${encodeURIComponent(fallbackName)}`;
    } else {
      state.redirectUrl = "https://informedmarketopinions.com/";
    }
  }

  // 3. Update to Result State
  contentArea.innerHTML = `
    <div class="result-text">Hey, our AI shopping enhancements results are suitable!</div>
    <button class="cta-button" id="redirect-btn">View Results</button>
  `;

  // 4. Add Event Listener for redirect button
  const btn = shadowRoot.getElementById('redirect-btn');
  btn.addEventListener('click', () => {
    if (state.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  });

  // 5. Re-attach close button listener if needed
  const closeBtn = shadowRoot.getElementById('close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeUI();
    });
  }
}

// Run init when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "activate_imo_ui") {
    console.log("IMO Extension: Manual activation requested.");
    attemptActivation();
  }
});
