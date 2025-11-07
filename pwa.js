let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;

  // Create a container for the buttons
  const installContainer = document.createElement("div");
  installContainer.id = "install-container";
  installContainer.style.position = "fixed";
  installContainer.style.bottom = "20px";
  installContainer.style.left = "20px";
  installContainer.style.padding = "10px";
  installContainer.style.backgroundColor = "#9eb0eb";
  installContainer.style.border = "1px solid #ccc";
  installContainer.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.1)";
  installContainer.style.borderRadius = "5px";

  // Create the Install button
  const installButton = document.createElement("button");
  installButton.textContent = "Install App";
  installButton.style.marginRight = "10px";
  installContainer.appendChild(installButton);

  // Create the Hide button
  const hideButton = document.createElement("button");
  hideButton.textContent = "Hide";
  installContainer.appendChild(hideButton);

  document.body.appendChild(installContainer);

  installButton.addEventListener("click", () => {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      deferredPrompt = null;
      // Remove the install container after the user makes a choice
      installContainer.remove();
    });
  });

  hideButton.addEventListener("click", () => {
    // Hide the install container
    installContainer.style.display = "none";
  });
});
