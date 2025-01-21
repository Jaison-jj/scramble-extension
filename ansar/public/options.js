const checkbox = document.getElementById("autoPopupCheckbox");
const saveButton = document.getElementById("saveButton");
const envSelect = document.getElementById("env-select");

saveButton.addEventListener("click", () => {
  const isChecked = checkbox.checked;
  const selectedEnv = envSelect.value;

  chrome.runtime.sendMessage({
    action: "saveUserSettings",
    enableAuto: isChecked,
    selectedEnv,
  });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["selectedEnv"], (result) => {
    const env = result?.selectedEnv || "";
    console.log(env);
    envSelect.value = env || 'dev'
  });
});
