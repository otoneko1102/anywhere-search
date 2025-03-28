(() => {
  if (window.anywhereSearchInjected) return;
  window.anywhereSearchInjected = true;

  const searchContainer = document.createElement("div");
  searchContainer.id = "anywhere-search-container";
  searchContainer.innerHTML = `
    <input type="search" id="anywhere-search-input" autocomplete="off">
    <div id="anywhere-search-partition"></div>
    <select id="anywhere-search-engine"></select>
    <button id="anywhere-search-btn">
      <img id="anywhere-search-icon" src="${chrome.runtime.getURL("assets/search-button.svg")}" alt="Search">
    </button>
  `;
  document.body.appendChild(searchContainer);

  const input = document.getElementById("anywhere-search-input");
  const part = document.getElementById("anywhere-search-partition");
  const select = document.getElementById("anywhere-search-engine");
  const button = document.getElementById("anywhere-search-btn");

  let visible = false;
  let searchEngines = [];
  let searchMode = "new-tab-switch";
  const defaultEngine = { label: "Google", url: "https://www.google.com/search?q=*" };

  function applyPosition(position) {
    searchContainer.style.setProperty("position", "fixed", "important");
    searchContainer.style.setProperty("top", "auto", "important");
    searchContainer.style.setProperty("bottom", "auto", "important");
    searchContainer.style.setProperty("left", "auto", "important");
    searchContainer.style.setProperty("right", "auto", "important");

    if (position.includes("top")) {
      searchContainer.style.setProperty("top", "10px", "important");
    } else if (position.includes("bottom")) {
      searchContainer.style.setProperty("bottom", "10px", "important");
    }

    if (position.includes("left")) {
      searchContainer.style.setProperty("left", "10px", "important");
    } else if (position.includes("right")) {
      searchContainer.style.setProperty("right", "10px", "important");
    }
  }

  function applyTheme(mode) {
    const isDark = mode === "dark";
    const bgColor = isDark ? "#4d5160" : "#ffffff";
    const textColor = isDark ? "#ffffff" : "#000000";

    searchContainer.style.setProperty("background", bgColor, "important");
    input.style.setProperty("background", bgColor, "important");
    input.style.setProperty("color", textColor, "important");
    part.style.setProperty("border-color", textColor, "important");
    select.style.setProperty("background", bgColor, "important");
    select.style.setProperty("color", textColor, "important");
    button.style.setProperty("background", bgColor, "important");
  }

  function forceApplyStyles() {
    const existingStyle = document.getElementById("anywhere-search-style");
    if (existingStyle) existingStyle.remove();

    const style = document.createElement("style");
    style.id = "anywhere-search-style";
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New&display=swap');

      #anywhere-search-container {
        font-family: font-family: 'Zen Kaku Gothic New', sans-serif !important;
        position: fixed !important;
        display: flex;
        align-items: center !important;
        background: #ffffff !important;
        padding: 5px !important;
        width: 380px !important;
        height: 40px !important;
        min-width: 380px !important;
        min-height: 40px !important;
        max-width: 380px !important;
        max-height: 40px !important;
        border-radius: 35px !important;
        border: 1px solid rgba(80, 80, 80, 0.5) !important;
        box-shadow: 5px 5px 5px rgba(80, 80, 80, 0.5) !important;
        z-index: 999999 !important;
      }

      #anywhere-search-input {
        font-family: font-family: 'Zen Kaku Gothic New', sans-serif !important;
        background-color: #ffffff !important;
        color: #000000 !important;
        border: none !important;
        border-radius: 15px;
        outline: none !important;
        padding: 5px !important;
        width: 240px !important;
        height: 25px !important;
        min-width: 240px !important;
        min-height: 25px !important;
        max-width: 240px !important;
        max-height: 25px !important;
      }

      #anywhere-search-input:focus {
        border: none !important;
        outline: none !important;
      }

      #anywhere-search-partition {
        border: 1px solid !important;
        border-color: #000000 !important;
        opacity: 0.3 !important;
        width: 0 !important;
        height: 80% !important;
        min-width: 0 !important;
        min-height: 80% !important;
        max-width: 0 !important;
        max-height: 80% !important;
      }

      #anywhere-search-engine {
        font-family: font-family: 'Zen Kaku Gothic New', sans-serif !important;
        font-size: 10px !important;
        text-align: left !important;
        border: none !important;
        border-radius: 15px !important;
        outline: none !important;
        padding: 4px !important;
        margin: 1px 5px !important;
        width: 85px !important;
        height: 30px !important;
        min-width: 85px !important;
        min-height: 30px !important;
        max-width: 85px !important;
        max-height: 30px !important;
        cursor: pointer !important;
      }

      #anywhere-search-engine:focus {
        border: none !important;
        outline: none !important;
      }

      #anywhere-search-btn {
        background-color: #ffffff !important;
        border: none !important;
        border-radius: 15px !important;
        width: 30px !important;
        height: 30px !important;
        min-width: 30px !important;
        min-height: 30px !important;
        max-width: 30px !important;
        max-height: 30px !important;
        margin: 0 !important;
        padding: 0 3px !important;
        cursor: pointer !important;
      }

      #anywhere-search-icon {
        width: 25px !important;
        height: 25px !important;
        min-width: 25px !important;
        min-height: 25px !important;
        max-width: 25px !important;
        max-height: 25px !important;
      }
    `;
    document.head.appendChild(style);
  }

  forceApplyStyles();

  function updateSearchEngines(engines, selectedEngine) {
    searchEngines = engines.length ? engines : [defaultEngine];

    select.innerHTML = "";
    searchEngines.forEach(engine => {
      const option = document.createElement("option");
      option.value = engine.url;
      option.textContent = engine.label;
      select.appendChild(option);
    });

    let selectedUrl = selectedEngine || defaultEngine.url;
    if (!searchEngines.some(engine => engine.url === selectedUrl)) {
      selectedUrl = defaultEngine.url;
    }

    select.value = selectedUrl;
  }

  function applySettings(data) {
    applyPosition(data.searchBarPosition || "top-right");
    applyTheme(data.themeMode || "light");
    searchMode = data.searchMode || "new-tab-switch";
    updateSearchEngines(data.searchEngines || [defaultEngine], data.searchEngine);
  }

  chrome.storage.sync.get(["searchBarPosition", "themeMode", "searchEngines", "searchEngine", "searchMode"], applySettings);

  function toggleSearchBar() {
    visible = !visible;
    searchContainer.style.display = visible ? "flex" : "none";
    if (visible && document.activeElement !== input) {
      input.focus();
    }
  }

  function performSearch() {
    const query = input.value.trim();
    if (query) {
      const searchUrl = select.value.replace("*", encodeURIComponent(query));

      chrome.storage.sync.get(["searchMode"], (data) => {
        const searchMode = data.searchMode || "new-tab-switch";

        try {
          if (searchMode === "new-tab-no-switch") {
            chrome.runtime.sendMessage({ action: "openTab", url: searchUrl });
          } else if (searchMode === "same-tab") {
            window.location.href = searchUrl;
          } else {
            window.open(searchUrl, "_blank");
          }
        } catch (error) {
          console.error("An error occurred during the search process:", error);
        }
      });

      // toggleSearchBar();
    }
  }

  button.addEventListener("click", performSearch);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && visible) {
      if (document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      }
    }

    if (e.key === "Escape" && visible && document.activeElement === input) {
      input.blur();
    }

    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && visible && document.activeElement === input) {
      e.preventDefault();
      const options = [...select.options];
      let currentIndex = options.findIndex(option => option.value === select.value);

      if (e.key === "ArrowUp") {
        currentIndex = (currentIndex - 1 + options.length) % options.length;
      } else {
        currentIndex = (currentIndex + 1) % options.length;
      }

      select.value = options[currentIndex].value;
      chrome.storage.sync.set({ searchEngine: select.value });
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggleSearch") {
      toggleSearchBar();
    } else if (message.action === "updatePosition") {
      applyPosition(message.value);
    } else if (message.action === "updateTheme") {
      applyTheme(message.value);
    } else if (message.action === "updateSearchEngines") {
      updateSearchEngines(message.engines, select.value);
    } else if (message.action === "updateSearchMode") {
      searchMode = message.value;
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      chrome.storage.sync.get(["searchBarPosition", "themeMode", "searchEngines", "searchEngine", "searchMode"], applySettings);
    }
  });

  searchContainer.style.display = "none";
})();
