/**
 * TurnKey Product Management - Application Logic
 * Handles form submissions, file uploads, and n8n webhook integration
 */

// =============================================
// CONFIGURATION
// =============================================
// Use local proxy to bypass CORS
const WEBHOOK_API_URL = '/api/webhook';

// State
let selectedFile = null;

// =============================================
// PAGE NAVIGATION
// =============================================
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    // Show target page
    document.getElementById(pageId).classList.add('active');

    // Clear all messages
    document.querySelectorAll('.success-message, .error-message').forEach(msg => {
        msg.classList.remove('show');
        msg.style.display = 'none';
    });
    document.querySelectorAll('.response-area').forEach(area => {
        area.classList.remove('show');
        area.style.display = 'none';
    });

    // Clear progress logs when navigating back to page1 (welcome screen)
    if (pageId === 'page1') {
        clearProgressLogs();
    }
}

// =============================================
// PROGRESS LOG HELPERS
// =============================================
function clearProgressLogs() {
    const logContainer = document.getElementById('progressLog');
    const progressContainer = document.getElementById('progressContainer');

    if (logContainer) {
        logContainer.innerHTML = '';
    }
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

function getLogIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '⚠️';
        case 'warning': return '⚠️';
        case 'processing': return '🔄';
        case 'email': return '📧';
        default: return '➤';
    }
}

// =============================================
// WEBHOOK SUBMISSION
// =============================================
async function sendToBackend(data) {
    try {
        const response = await fetch(WEBHOOK_API_URL, {
            method: 'POST',
            body: data
        });

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            // If response is OK but not JSON, return text
            if (response.ok) return text;

            console.error('Server Error:', text);
            return { error: text || 'Unknown server error' };
        }
    } catch (error) {
        console.error('Network Error:', error);
        return { error: 'Network error. Please try again.' };
    }
}


// =============================================
// UI HELPERS
// =============================================
function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'flex';
        element.classList.add('show');

        // Ensure it has error styling if used for errors
        if (element.id.includes('error')) {
            element.classList.add('error-message');
            element.classList.remove('info-message');
        }

        // Auto-hide success messages after 3 seconds
        if (element.id.includes('success')) {
            setTimeout(() => {
                hideMessage(elementId);
            }, 3000);
        }
    }
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
        element.classList.remove('show');
    }
}

function showResponse(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        // Check if content contains a URL
        const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
        
        if (urlMatch) {
            const url = urlMatch[0];
            const textBeforeUrl = content.substring(0, content.indexOf(url)).trim();
            const textAfterUrl = content.substring(content.indexOf(url) + url.length).trim();
            
            // Create structured HTML with message and link with copy button
            element.innerHTML = `
                <div class="response-content">
                    <div class="response-message">${textBeforeUrl}</div>
                    <div class="response-link-container">
                        <a href="${url}" target="_blank" class="response-link" title="Open link">${url}</a>
                        <button type="button" class="btn-copy-link" onclick="copyLinkToClipboard('${url}')" title="Copy link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    ${textAfterUrl ? `<div class="response-message">${textAfterUrl}</div>` : ''}
                </div>
            `;
        } else {
            element.textContent = content;
        }
        
        element.style.display = 'block';
        element.classList.add('show');
    }
}

window.copyLinkToClipboard = function (url) {
    navigator.clipboard.writeText(url).then(() => {
        const btn = event.target.closest('.btn-copy-link');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✅';
            setTimeout(() => btn.innerHTML = original, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

function hideResponse(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
        element.classList.remove('show');
    }
}




function setButtonLoading(button, isLoading, originalText) {
    if (isLoading) {
        button.disabled = true;
        button.textContent = 'Processing... this may take time';
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.textContent = originalText;
        button.classList.remove('loading');
    }
}

function showPermissionError(elementId, email) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="permission-error">
                <p>⚠️ <strong>Access Denied:</strong> This Google Sheet is private.</p>
                <p class="small-text" style="margin-bottom: 10px;">To fix this, please share the sheet with our service email:</p>
                
                <div class="email-copy-container">
                    <code id="serviceEmail">${email}</code>
                    <button type="button" class="btn-copy" onclick="copyToClipboard('${email}')" title="Copy email">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>

                <div style="text-align: left; background: rgba(255,255,255,0.4); padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 0.9em;">
                    <strong>Steps to grant access:</strong>
                    <ol style="margin-left: 20px; margin-top: 5px; line-height: 1.6;">
                        <li>Open your Google Sheet</li>
                        <li>Click the <strong>Share</strong> button (top right)</li>
                        <li>Paste the email above into the "Add people" box</li>
                        <li>Set permission to <strong>Editor</strong></li>
                        <li>Copy <strong>Link</strong> and Click <strong>Done</strong></li>
                    </ol>
                </div>
            </div>
        `;
        element.style.display = 'flex';
        element.classList.add('show');

        // Use info styling instead of error
        element.classList.remove('error-message');
        element.classList.add('info-message');
    }
}

window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.btn-copy');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✅';
            setTimeout(() => btn.innerHTML = original, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// =============================================
// LINK FORM HANDLER
// =============================================
function initLinkForm() {
    const form = document.getElementById('linkForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const url = document.getElementById('linkUrl').value.trim();
        const brandName = document.getElementById('brandName').value.trim();
        const btn = document.getElementById('submitLinkBtn');

        // Hide previous messages
        hideMessage('successMessage2');
        hideMessage('errorMessage2');
        hideResponse('responseArea2');

        // Validation
        if (!brandName) {
            showMessage('errorMessage2', '⚠️ Please enter a brand name');
            return;
        }

        if (!url) {
            showMessage('errorMessage2', '⚠️ Please enter a valid URL');
            return;
        }

        // Loading state
        setButtonLoading(btn, true, 'Submit');

        // Prepare data
        const formData = new FormData();
        formData.append('type', 'link');
        formData.append('url', url);
        formData.append('brandName', brandName);

        // Send request
        const responseData = await sendToBackend(formData);

        // Reset button
        setButtonLoading(btn, false, 'Submit');

        // Handle response
        // Handle response
        if (responseData && !responseData.error) {
            let displayMsg = '';
            if (typeof responseData === 'object' && responseData.resetUrl) {
                displayMsg = responseData.resetUrl;
            } else if (typeof responseData === 'string') {
                displayMsg = responseData;
            } else {
                displayMsg = JSON.stringify(responseData, null, 2);
            }

            showMessage('successMessage2', '✅ Link submitted successfully!');
            showResponse('responseArea2', displayMsg);
            form.reset();
        } else if (responseData && responseData.requiresShare) {
            showPermissionError('errorMessage2', responseData.shareEmail);
        } else {
            const msg = responseData.error || 'Error submitting to server.';
            showMessage('errorMessage2', '❌ ' + msg);
        }
    });
}

// =============================================
// FILE UPLOAD HANDLER
// =============================================
function initFileUpload() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');

    if (!dropArea || !fileInput) return;

    // Click to browse
    dropArea.addEventListener('click', function () {
        fileInput.click();
    });

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    // Highlight on drag
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('dragover');
        }, false);
    });

    // Remove highlight
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('dragover');
        }, false);
    });

    // Handle drop
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFileSelect({ target: { files: files } });
        }
    }, false);

    // File input change
    fileInput.addEventListener('change', handleFileSelect);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        showMessage('errorMessage3', '⚠️ Please select a valid XLSX or XLS file');
        return;
    }

    selectedFile = file;

    // Update UI
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = `Size: ${formatFileSize(file.size)}`;
    document.getElementById('fileInfo').classList.add('show');
    document.getElementById('uploadBtn').disabled = false;

    hideMessage('errorMessage3');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// =============================================
// FILE FORM HANDLER
// =============================================
function initFileForm() {
    const form = document.getElementById('fileForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const brandName = document.getElementById('brandNameFile').value.trim();
        const btn = document.getElementById('uploadBtn');

        // Hide previous messages
        hideMessage('successMessage3');
        hideMessage('errorMessage3');
        hideResponse('responseArea3');

        // Validation
        if (!brandName) {
            showMessage('errorMessage3', '⚠️ Please enter a brand name');
            return;
        }

        if (!selectedFile) {
            showMessage('errorMessage3', '⚠️ Please select a file');
            return;
        }

        // Loading state
        setButtonLoading(btn, true, 'Upload File');

        // Prepare data
        const formData = new FormData();
        formData.append('type', 'file');
        formData.append('brandName', brandName);
        formData.append('data', selectedFile);

        // Send request
        const responseData = await sendToBackend(formData);

        // Reset button
        setButtonLoading(btn, false, 'Upload File');

        // Handle response
        if (responseData && !responseData.error) {
            let displayMsg = '';
            if (typeof responseData === 'object' && responseData.resetUrl) {
                displayMsg = responseData.resetUrl;
            } else if (typeof responseData === 'string') {
                displayMsg = responseData;
            } else {
                displayMsg = JSON.stringify(responseData, null, 2);
            }

            showMessage('successMessage3', '✅ File uploaded and processed successfully!');
            showResponse('responseArea3', displayMsg);

            // Reset file selection
            selectedFile = null;
            document.getElementById('fileInfo').classList.remove('show');
            document.getElementById('uploadBtn').disabled = true;
            document.getElementById('fileInput').value = '';
        } else {
            const msg = responseData.error || 'Error uploading file.';
            showMessage('errorMessage3', '❌ ' + msg);
        }
    });
}

// =============================================
// REAL-TIME PROGRESS
// =============================================
function initProgressStream() {
    const eventSource = new EventSource('/api/events');
    const logContainer = document.getElementById('progressLog');
    const MAX_LOGS = 5;

    eventSource.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const { message, type } = data;

        if (logContainer) {
            // If we already have 5 messages, clear all before adding new ones
            if (logContainer.children.length >= MAX_LOGS) {
                logContainer.innerHTML = '';
            }

            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${type}`;

            // Create message span only (no icon/arrow)
            const messageSpan = document.createElement('span');
            messageSpan.className = 'log-message';
            messageSpan.textContent = message;

            logEntry.appendChild(messageSpan);
            logContainer.appendChild(logEntry);

            // Show container if hidden with animation
            const progressContainer = document.getElementById('progressContainer');
            if (progressContainer.style.display === 'none') {
                progressContainer.style.display = 'block';
                progressContainer.classList.add('fade-in');
            }
        }
    };

    eventSource.onerror = function () {
        console.log('SSE connection error, retrying...');
    };
}

// =============================================
// INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    initLinkForm();
    initFileUpload();
    initFileForm();
    initProgressStream();

    console.log('TurnKey Product Management initialized');
});
