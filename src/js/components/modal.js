export function openModal({ title, contentHtml, onConfirm, confirmText = "Salvar" }) {
  let modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) modalOverlay.remove();

  modalOverlay = document.createElement("div");
  modalOverlay.id = "modal-overlay";
  modalOverlay.className = "modal-overlay";
  modalOverlay.innerHTML = `
    <div class="modal-card">
      <header class="modal-header">
        <h3>${title}</h3>
        <button id="modal-close-btn" class="modal-close-btn">&times;</button>
      </header>
      <div class="modal-body">
        ${contentHtml}
      </div>
      <footer class="modal-footer">
        <button id="modal-cancel-btn" class="btn btn-secondary">Cancelar</button>
        <button id="modal-confirm-btn" class="btn btn-primary">${confirmText}</button>
      </footer>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const closeModal = () => modalOverlay.remove();

  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("modal-cancel-btn").addEventListener("click", closeModal);
  
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.getElementById("modal-confirm-btn").addEventListener("click", async () => {
    if (onConfirm) {
      const success = await onConfirm(modalOverlay);
      if (success !== false) closeModal();
    } else {
      closeModal();
    }
  });
}
