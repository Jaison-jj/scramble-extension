window.addEventListener('load', () => {
    setTimeout(() => {
      let usernameField = document.querySelector('input[name="username"]');
      let passwordField = document.querySelector('input[name="password"]');
      if (usernameField && passwordField) {
        usernameField.value = 'xxxx';
        passwordField.value = 'yyyy';
      }
    }, 3500); // Wait for the popup to close
  });
  