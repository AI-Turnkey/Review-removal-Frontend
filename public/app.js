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
}

// =============================================
// WEBHOOK SUBMISSION
// =============================================
async function sendToBackend(data) {
    try {
        // Send FormData directly - server handles multipart forwarding
        const response = await fetch(WEBHOOK_API_URL, {
            method: 'POST',
            body: data
        });

        if (response.ok) {
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                return text;
            }
        } else {
            console.error('Server Error:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        return false;
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
        element.textContent = content;
        element.style.display = 'block';
        element.classList.add('show');
    }
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
        if (responseData !== false) {
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
        } else {
            showMessage('errorMessage2', '❌ Error submitting to server. Check console for details.');
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
        if (responseData !== false) {
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
            showMessage('errorMessage3', '❌ Error uploading file. Check console for details.');
        }
    });
}

// =============================================
// REAL-TIME PROGRESS
// =============================================
function initProgressStream() {
    const eventSource = new EventSource('/api/events');
    const logContainer = document.getElementById('progressLog');

    eventSource.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const { message, type } = data;

        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${type}`;
            logEntry.textContent = `> ${message}`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;

            // Show container if hidden
            document.getElementById('progressContainer').style.display = 'block';
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
