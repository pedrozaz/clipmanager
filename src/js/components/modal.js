export function showModal({ title, body, buttons }) {
  let modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) modalOverlay.remove();

  modalOverlay = document.createElement("div");
  modalOverlay.id = "modal-overlay";
  modalOverlay.className = "modal-overlay";

  const buttonsHtml = (buttons || [])
    .map((btn, index) => {
      const type = btn.type || "button";
      return `<button id="modal-btn-${index}" class="${btn.class || 'btn btn-secondary'}" type="${type}">${btn.text}</button>`;
    })
    .join("");

  modalOverlay.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h3 class="modal-title">${title}</h3>
      </header>
      <div class="modal-body">
        ${body}
      </div>
      <footer class="modal-footer">
        ${buttonsHtml}
      </footer>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const modalAPI = {
    close: () => modalOverlay.remove(),
    element: modalOverlay
  };

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalAPI.close();
  });

  if (buttons) {
    buttons.forEach((btn, index) => {
      const btnEl = document.getElementById(`modal-btn-${index}`);
      if (btnEl) {
        btnEl.addEventListener("click", async () => {
          if (btn.onClick) {
            await btn.onClick(modalAPI);
          } else if (btn.close) {
            modalAPI.close();
          }
        });
      }
    });
  }
}
