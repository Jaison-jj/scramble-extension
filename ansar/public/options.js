const checkbox = document.getElementById("autoPopupCheckbox");
const saveButton = document.getElementById("saveButton");

saveButton.addEventListener('click', () => {
    const isChecked = checkbox.checked 
    console.log(`The checkbox is currently ${isChecked}.`);
    chrome.runtime.sendMessage({
        action: 'saveUserSettingForAutoPopup',
        enableAuto: isChecked
      });
  });