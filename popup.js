document.addEventListener("DOMContentLoaded", () => {
  const visitTutorialButton = document.getElementById("visit-tutorial");
  const openShortcutsButton = document.getElementById("open-shortcuts")
  const positionRadios = document.querySelectorAll("input[name='position']");
  const themeRadios = document.querySelectorAll("input[name='theme']");
  const searchModeRadios = document.querySelectorAll("input[name='searchMode']");
  const addEngineButton = document.getElementById("add-engine");
  const errorMessage = document.getElementById("error");
  const engineLabelInput = document.getElementById("engine-label");
  const engineUrlInput = document.getElementById("engine-url");
  const searchEnginesContainer = document.getElementById("search-engines");

  const defaultEngine = { label: "Google", url: "https://www.google.com/search?q=*" };

  function showErrorMessage(content) {
    errorMessage.textContent = content;
    errorMessage.style.display = "block";
    setTimeout(() => {
      errorMessage.textContent = '';
      errorMessage.style.display = 'none';
    }, 1000);
  }

  function updateThemeClass(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("light", theme === "light");
  }

  function updateUI(data) {
    document.querySelector(`input[name='position'][value="${data.searchBarPosition || "top-right"}"]`).checked = true;
    document.querySelector(`input[name='theme'][value="${data.themeMode || "light"}"]`).checked = true;
    document.querySelector(`input[name='searchMode'][value="${data.searchMode || "new-tab-switch"}"]`).checked = true;

    updateThemeClass(data.themeMode || "light");
    const engines = data.searchEngines && data.searchEngines.length ? data.searchEngines : [defaultEngine];
    chrome.storage.sync.set({ searchEngines: engines }, () => updateEngineList(engines));
  }

  chrome.storage.sync.get(["searchBarPosition", "themeMode", "searchEngines", "searchMode"], updateUI);

  function setupInstantSave(radioGroup, storageKey, messageAction) {
    radioGroup.forEach(radio => {
      radio.addEventListener("change", (e) => {
        const newValue = e.target.value;
        chrome.storage.sync.set({ [storageKey]: newValue }, () => {
          sendMessageToContent({ action: messageAction, value: newValue });
          if (storageKey === "themeMode") updateThemeClass(newValue);
        });
      });
    });
  }

  setupInstantSave(positionRadios, "searchBarPosition", "updatePosition");
  setupInstantSave(themeRadios, "themeMode", "updateTheme");
  setupInstantSave(searchModeRadios, "searchMode", "updateSearchMode");

  visitTutorialButton.addEventListener("click", () => {
    window.open(`https://anywhere-search.commonjs.work/${chrome.i18n.getMessage("LangCode") || "en"}.html`);
  });

  openShortcutsButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openShortcuts" });
  });

  addEngineButton.addEventListener("click", () => {
    function disableAddButton() {
      addEngineButton.disabled = true;
      setTimeout(() => {
        addEngineButton.disabled = false;
      }, 1000);
    }

    disableAddButton();
    const label = engineLabelInput.value.trim();
    const url = engineUrlInput.value.trim();

    if (
      !label ||
      !url.includes("*") ||
      (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
      )
    ) {
      showErrorMessage(chrome.i18n.getMessage("ErrorIncorrect"));
      return;
    }

    chrome.storage.sync.get(["searchEngines"], (data) => {
      let engines = data.searchEngines || [defaultEngine];

      if (engines.some(engine => engine.url === url)) {
        showErrorMessage(chrome.i18n.getMessage("ErrorAlready"));
        return;
      }

      if (engines.some(engine => engine.label === label)) {
        showErrorMessage(chrome.i18n.getMessage("ErrorSame"));
        return;
      }

      engines.push({ label, url });
      chrome.storage.sync.set({ searchEngines: engines }, () => {
        updateEngineList(engines);
        sendMessageToContent({ action: "updateSearchEngines", engines });
        engineLabelInput.value = "";
        engineUrlInput.value = "";
      });
    });
  });

  function updateEngineList(engines) {
    searchEnginesContainer.innerHTML = "";
    engines.forEach((engine, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${engine.label}</td>
        <td>${engine.url}</td>
        <td>
          <button class="delete-btn" data-index="${index}" ${engine.url === defaultEngine.url ? "disabled" : ""}>x</button>
        </td>
      `;
      searchEnginesContainer.appendChild(row);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.dataset.index;
        engines.splice(index, 1);
        chrome.storage.sync.set({ searchEngines: engines }, () => {
          updateEngineList(engines);
          sendMessageToContent({ action: "updateSearchEngines", engines });
        });
      });
    });
  }

  function sendMessageToContent(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }

  chrome.storage.onChanged.addListener((changes) => {
    Object.keys(changes).forEach((key) => {
      sendMessageToContent({
        action
          : key === "searchBarPosition" ? "updatePosition"
          : key === "themeMode" ? "updateTheme"
          : key === "searchEngines" ? "updateSearchEngines"
          : key === "searchMode" ? "updateSearchMode"
          : null,
        value: changes[key].newValue
      });
    });
  });
});
