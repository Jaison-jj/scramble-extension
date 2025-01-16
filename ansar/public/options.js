const checkbox = document.getElementById("autoPopupCheckbox");
const saveButton = document.getElementById("saveButton");
const envSelect = document.getElementById("env-select");

saveButton.addEventListener('click', () => {
    const isChecked = checkbox.checked 
    const selectedEnv = envSelect.value;
    console.log(`The checkbox is currently ${isChecked}.`);
    chrome.runtime.sendMessage({
        action: 'saveUserSettings',
        enableAuto: isChecked,
        selectedEnv
      });
  });