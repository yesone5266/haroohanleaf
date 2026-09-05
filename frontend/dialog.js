(function () {
    // 1. Toast Container (Alert & Confirm)
    const toastContainer = document.createElement('div');
    toastContainer.id = 'custom-toast-container';
    document.body.appendChild(toastContainer);

    // 2. Prompt Overlay (Modal)
    const promptOverlay = document.createElement('div');
    promptOverlay.id = 'custom-prompt-overlay';
    promptOverlay.innerHTML = `
        <div class="custom-prompt-modal">
            <div class="custom-prompt-title" id="custom-prompt-title"></div>
            <input type="text" class="custom-prompt-input" id="custom-prompt-input" />
            <div class="custom-prompt-actions">
                <button class="custom-prompt-btn-cancel" id="custom-prompt-cancel">취소</button>
                <button class="custom-prompt-btn-submit" id="custom-prompt-submit">확인</button>
            </div>
        </div>
    `;
    document.body.appendChild(promptOverlay);

    const promptTitle = document.getElementById('custom-prompt-title');
    const promptInput = document.getElementById('custom-prompt-input');
    const promptCancel = document.getElementById('custom-prompt-cancel');
    const promptSubmit = document.getElementById('custom-prompt-submit');

    window.AppDialog = {
        alert: function (message) {
            return new Promise((resolve) => {
                const toast = document.createElement('div');
                toast.className = 'custom-toast';
                
                const msgDiv = document.createElement('div');
                msgDiv.className = 'custom-toast-msg';
                msgDiv.textContent = message;
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'custom-toast-actions';
                
                const okBtn = document.createElement('button');
                okBtn.className = 'custom-toast-btn confirm';
                okBtn.textContent = '확인';
                
                okBtn.addEventListener('click', () => {
                    toast.remove();
                    resolve();
                });
                
                actionsDiv.appendChild(okBtn);
                toast.appendChild(msgDiv);
                toast.appendChild(actionsDiv);
                
                toastContainer.appendChild(toast);
                
                // Auto dismiss after 3 seconds for alert, but let's keep it simple and require click
            });
        },
        
        confirm: function (message) {
            return new Promise((resolve) => {
                const toast = document.createElement('div');
                toast.className = 'custom-toast';
                
                const msgDiv = document.createElement('div');
                msgDiv.className = 'custom-toast-msg';
                msgDiv.textContent = message;
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'custom-toast-actions';
                
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'custom-toast-btn cancel';
                cancelBtn.textContent = '취소';
                
                const okBtn = document.createElement('button');
                okBtn.className = 'custom-toast-btn confirm';
                okBtn.textContent = '확인';
                
                cancelBtn.addEventListener('click', () => {
                    toast.remove();
                    resolve(false);
                });
                
                okBtn.addEventListener('click', () => {
                    toast.remove();
                    resolve(true);
                });
                
                actionsDiv.appendChild(cancelBtn);
                actionsDiv.appendChild(okBtn);
                toast.appendChild(msgDiv);
                toast.appendChild(actionsDiv);
                
                toastContainer.appendChild(toast);
            });
        },
        
        prompt: function (message, defaultValue = '') {
            return new Promise((resolve) => {
                promptTitle.textContent = message;
                promptInput.value = defaultValue;
                
                const cleanup = () => {
                    promptOverlay.classList.remove('active');
                    promptSubmit.removeEventListener('click', onSubmit);
                    promptCancel.removeEventListener('click', onCancel);
                    promptInput.removeEventListener('keydown', onKeydown);
                };
                
                const onSubmit = () => {
                    const val = promptInput.value;
                    cleanup();
                    resolve(val);
                };
                
                const onCancel = () => {
                    cleanup();
                    resolve(null);
                };

                const onKeydown = (e) => {
                    if (e.key === 'Enter') onSubmit();
                    if (e.key === 'Escape') onCancel();
                };
                
                promptSubmit.addEventListener('click', onSubmit);
                promptCancel.addEventListener('click', onCancel);
                promptInput.addEventListener('keydown', onKeydown);
                
                promptOverlay.classList.add('active');
                promptInput.focus();
            });
        }
    };
})();
