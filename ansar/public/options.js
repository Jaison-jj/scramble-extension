const checkbox = document.getElementById("autoPopupCheckbox");
const saveButton = document.getElementById("saveButton");
const envSelect = document.getElementById("env-select");
const orgSelect = document.getElementById("org-select");

saveButton.addEventListener("click", () => {
  const isChecked = checkbox.checked;
  const selectedEnv = envSelect.value;
  const selectedOrg = orgSelect.value;

  debugger
  chrome.runtime.sendMessage({
    action: "saveUserSettings",
    enableAuto: isChecked,
    selectedEnv,
    selectedOrg,
  });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["selectedEnv", "selectedOrg"], (result) => {
    const env = result?.selectedEnv || "dev";
    const org = result?.selectedOrg || "dem";
    debugger
    envSelect.value = env;
    orgSelect.value = org;
  });
});