const checkbox = document.getElementById("autoPopupCheckbox");
const saveButton = document.getElementById("saveButton");
const envSelect = document.getElementById("env-select");
const orgSelect = document.getElementById("org-select");

saveButton.addEventListener("click", () => {
  const isChecked = checkbox.checked;
  const selectedEnv = envSelect.value;
  const selectedOrg = orgSelect.value;

  chrome.runtime.sendMessage({
    action: "saveUserSettings",
    enableAuto: isChecked,
    selectedEnv,
    selectedOrg,
  });

  alert("Settings saved successfully.");
  console.log(
    JSON.stringify({
      env: selectedEnv,
      org: selectedOrg,
      autoPopup: isChecked,
    })
  );
});

document.addEventListener("DOMContentLoaded", async () => {
  await chrome.storage.local.get(
    ["selectedEnv", "selectedOrg", "isAutoPopup"],
    (result) => {
      const env = result?.selectedEnv || "demo";
      const org = result?.selectedOrg || "dem";
      const isAuto = result?.isAutoPopup || false;
      envSelect.value = env;
      orgSelect.value = org;
      checkbox.checked  = isAuto;
    }
  );
});
