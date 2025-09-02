// Global state management
let currentStep = 0; // Start with loan selection
let formData = {
    loanAmount: 1000000, // Default 10 lakhs
    interestRate: 8.5,
    tenure: 84
};
let uploadedDocuments = {};
let selectedEmploymentSubType = 'salaried'; // Track employment sub-type

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    updateStepDisplay();
    setupEventListeners();
    setupAutoCalculations();
    setupTenureSlider();
    setApplicationDate();
    updateEmploymentSubTypeVisibility(); // Initialize employment sub-type visibility
    updateDocumentVisibility(); // Initialize document visibility
});

// Setup event listeners
function setupEventListeners() {
    // Selection button handlers
    const selectionButtons = document.querySelectorAll('.selection-btn');
    selectionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.selection-group');
            const buttons = group.querySelectorAll('.selection-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Handle loan type selection to show/hide sub-type
            if (this.dataset.value === 'vehicle') {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'block';
            } else if (this.closest('.selection-group').querySelector('[data-value="vehicle"]')) {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'none';
            }

            // Track employment type changes
            const groupLabel = group.querySelector('label').textContent.toLowerCase();
            if (groupLabel.includes('employment type') && !groupLabel.includes('sub')) {
                formData.employmentType = this.dataset.value;
                updateEmploymentSubTypeVisibility();
                updateIncomeFormVisibility();
            }

            // Track employment sub-type changes
            if (groupLabel.includes('employment sub type')) {
                selectedEmploymentSubType = this.dataset.value;
                formData.employmentSubType = this.dataset.value;
                updateDocumentVisibility();
                updateIncomeFormVisibility();
                updatePersonalFormVisibility();
            }
        });
    });

    // Form input handlers for data persistence
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', saveFormData);
        input.addEventListener('input', saveFormData);
    });

    // Mobile verify button handler
    const mobileVerifyBtn = document.getElementById('mobileVerifyBtn');
    if (mobileVerifyBtn) {
        mobileVerifyBtn.addEventListener('click', function() {
            const mobileInput = document.getElementById('mobile');

            if (mobileInput.value && validateMobile(mobileInput.value)) {
                showOTPModal(mobileInput.value);
            } else {
                showError('Please enter a valid 10-digit mobile number');
            }
        });
    }

    // Identity document dropdown handler
    const identityDocument = document.getElementById('identityDocument');
    if (identityDocument) {
        identityDocument.addEventListener('change', function() {
            updateIdNumberLabel(this.value);
        });
    }

    // Verify button handlers for business forms
    const verifyBtns = document.querySelectorAll('.verify-btn:not(#mobileVerifyBtn)');
    verifyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const container = this.closest('.mobile-input-container');
            const mobileInput = container.querySelector('input[type="text"]');

            if (mobileInput.value && validateMobile(mobileInput.value)) {
                showOTPModal(mobileInput.value);
            } else {
                showError('Please enter a valid 10-digit mobile number');
            }
        });
    });

    // Existing customer dropdown handler
    const existingCustomerSelect = document.getElementById('existingCustomer');
    if (existingCustomerSelect) {
        existingCustomerSelect.addEventListener('change', function() {
            const cifField = document.getElementById('cifNumber');
            if (this.value === 'yes') {
                cifField.required = true;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Enter your CIF number';
            } else if (this.value === 'no') {
                cifField.required = false;
                cifField.value = '';
                cifField.disabled = true;
                cifField.style.backgroundColor = '#f0f0f0';
                cifField.placeholder = 'Not applicable';
            } else {
                // If no option selected, reset to default
                cifField.required = false;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Select existing customer first';
            }
        });
    }

    // Existing customer dropdown handler for company form
    const existingCustomerCompanySelect = document.getElementById('existingCustomerCompany');
    if (existingCustomerCompanySelect) {
        existingCustomerCompanySelect.addEventListener('change', function() {
            const cifField = document.getElementById('cifNumberCompany');
            if (this.value === 'yes') {
                cifField.required = true;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Enter your CIF number';
            } else if (this.value === 'no') {
                cifField.required = false;
                cifField.value = '';
                cifField.disabled = true;
                cifField.style.backgroundColor = '#f0f0f0';
                cifField.placeholder = 'Not applicable';
            } else {
                // If no option selected, reset to default
                cifField.required = false;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Select existing customer first';
            }
        });
    }
}

// Navigation functions
function nextStep() {
    if (validateCurrentStep()) {
        saveFormData();
        currentStep++;

        // Handle special navigation
        if (currentStep === 5) {
            // After step 4 (offer), go to document upload
            updateStepDisplay();
        } else if (currentStep === 6) {
            // After document upload, go to final approval
            updateStepDisplay();
        } else {
            updateStepDisplay();
            updateProgressStepper();
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;

        if (currentStep === 5) {
            // Going back to document upload
            updateStepDisplay();
        } else if (currentStep >= 1 && currentStep <= 4) {
            // Normal steps with progress stepper
            updateStepDisplay();
            updateProgressStepper();
        } else {
            // Loan selection page
            updateStepDisplay();
        }
    }
}

function startApplication() {
    saveSelectionData();
    currentStep = 1;
    updateStepDisplay();
    updateProgressStepper();
}

// Display management
function updateStepDisplay() {
    // Hide all step contents
    const stepContents = document.querySelectorAll('.step-content');
    stepContents.forEach(content => {
        content.style.display = 'none';
    });

    // Hide/show progress stepper based on current step
    const progressStepper = document.querySelector('.progress-stepper');
    if (progressStepper) {
        if (currentStep === 0 || currentStep >= 5) {
            progressStepper.style.display = 'none';
        } else {
            progressStepper.style.display = 'flex';
        }
    }

    // Show current step
    if (currentStep === 0) {
        // Loan selection page
        const loanSelection = document.getElementById('loan-selection');
        if (loanSelection) loanSelection.style.display = 'block';
    } else if (currentStep >= 1 && currentStep <= 4) {
        // Normal application steps
        const currentStepElement = document.getElementById(`step-${currentStep}`);
        if (currentStepElement) currentStepElement.style.display = 'block';
    } else if (currentStep === 5) {
        // Document upload page
        const documentUpload = document.getElementById('document-upload');
        if (documentUpload) documentUpload.style.display = 'block';
    } else if (currentStep === 6) {
        // Final approval page
        const finalApproval = document.getElementById('final-approval');
        if (finalApproval) finalApproval.style.display = 'block';
    } else if (currentStep === 7) {
        // Thank you page
        const thankYou = document.getElementById('thank-you');
        if (thankYou) thankYou.style.display = 'block';
    }

    // Update EMI calculation when showing offer
    if (currentStep === 4) {
        calculateEMI();
    }

    // Update form visibility when showing basic details step
    if (currentStep === 1) {
        updateBasicFormVisibility();
    }

    // Update form visibility when showing personal details step
    if (currentStep === 2) {
        updatePersonalFormVisibility();
    }

    // Update form visibility when showing income details step
    if (currentStep === 3) {
        updateIncomeFormVisibility();
    }
}

function updateProgressStepper() {
    const steps = document.querySelectorAll('.step[data-step]');
    steps.forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');

        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

// Validation functions
function validateCurrentStep() {
    switch (currentStep) {
        case 0:
            return validateLoanSelection();
        case 1:
            return validateBasicDetails();
        case 2:
            return validatePersonalDetails();
        case 3:
            return validateIncomeDetails();
        case 4:
            return true; // Offer page
        case 5:
            return validateDocumentUpload();
        default:
            return true;
    }
}

function validateLoanSelection() {
    const loanTypeSelected = document.querySelector('.selection-btn.active[data-value]');
    if (!loanTypeSelected) {
        showError('Please select a loan type to continue');
        return false;
    }
    return true;
}

function validateDocumentUpload() {
    let requiredDocs = ['bankStatement', 'dealerInvoice', 'itrDoc'];

    // GST is only required for self-employed business
    if (selectedEmploymentSubType === 'self-business') {
        requiredDocs.push('gstDoc');
    }

    const uploadedCount = Object.keys(uploadedDocuments).length;
    const allUploaded = requiredDocs.every(docId => uploadedDocuments[docId]);

    if (!allUploaded) {
        const missingDocs = requiredDocs.filter(docId => !uploadedDocuments[docId]);
        showError(`Please upload all required documents. Missing: ${missingDocs.join(', ')}`);
        return false;
    }
    return true;
}

function validateBasicDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        return validateNonIndividualBasicDetails();
    } else {
        return validateIndividualBasicDetails();
    }
}

function validateIndividualBasicDetails() {
    const fullName = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();

    let isValid = true;

    if (!fullName) {
        showFieldError('fullName', 'Please enter your full name');
        isValid = false;
    }

    if (!mobile || !validateMobile(mobile)) {
        showFieldError('mobile', 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }

    // Check if mobile is verified
    const verifyBtn = document.getElementById('mobileVerifyBtn');
    if (!verifyBtn.disabled) {
        showError('Please verify your mobile number first');
        isValid = false;
    }

    // Only validate visible fields
    const identityDocGroup = document.getElementById('identityDocGroup');
    if (identityDocGroup && identityDocGroup.style.display !== 'none') {
        const identityDocument = document.getElementById('identityDocument').value;
        if (!identityDocument) {
            showFieldError('identityDocument', 'Please select an identity document');
            isValid = false;
        }
    }

    const idNumberGroup = document.getElementById('idNumberGroup');
    if (idNumberGroup && idNumberGroup.style.display !== 'none') {
        const idNumber = document.getElementById('idNumber').value.trim();
        if (!idNumber) {
            showFieldError('idNumber', 'Please enter your identity document number');
            isValid = false;
        }
    }

    const panNumberGroup = document.getElementById('panNumberGroup');
    if (panNumberGroup && panNumberGroup.style.display !== 'none') {
        const panNumber = document.getElementById('panNumber').value.trim();
        if (!panNumber || !validatePAN(panNumber)) {
            showFieldError('panNumber', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
            isValid = false;
        }
    }

    const emailGroup = document.getElementById('emailGroup');
    if (emailGroup && emailGroup.style.display !== 'none') {
        const email = document.getElementById('email').value.trim();
        if (!email || !validateEmail(email)) {
            showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }
    }

    const loanAmountGroup = document.getElementById('loanAmountGroup');
    if (loanAmountGroup && loanAmountGroup.style.display !== 'none') {
        const loanAmount = document.getElementById('loanAmount').value.trim();
        if (!loanAmount || parseFloat(loanAmount) <= 0) {
            showFieldError('loanAmount', 'Please enter a valid loan amount');
            isValid = false;
        } else {
            formData.loanAmount = parseFloat(loanAmount);
        }
    }

    const termsGroup = document.getElementById('termsConditionsGroup');
    if (termsGroup && termsGroup.style.display !== 'none') {
        const agreeTerms = document.getElementById('agreeTerms').checked;
        const agreeConsent = document.getElementById('agreeConsent').checked;

        if (!agreeTerms) {
            showError('Please agree to the Terms & Conditions');
            isValid = false;
        }

        if (!agreeConsent) {
            showError('Please agree to the consent for information sharing');
            isValid = false;
        }
    }

    return isValid;
}

function validateNonIndividualBasicDetails() {
    const fullName = document.getElementById('businessFullName').value.trim();
    const mobile = document.getElementById('businessMobile').value.trim();
    const loanAmount = document.getElementById('businessLoanAmount').value.trim();
    const panNumber = document.getElementById('businessPanNumber').value.trim();
    const agreeTerms = document.getElementById('businessAgreeTerms').checked;
    const agreeConsent = document.getElementById('businessAgreeConsent').checked;

    let isValid = true;

    if (!fullName) {
        showFieldError('businessFullName', 'Please enter your full name');
        isValid = false;
    }

    if (!mobile || !validateMobile(mobile)) {
        showFieldError('businessMobile', 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }

    if (!loanAmount || parseFloat(loanAmount) <= 0) {
        showFieldError('businessLoanAmount', 'Please enter a valid loan amount');
        isValid = false;
    } else {
        formData.loanAmount = parseFloat(loanAmount);
    }

    if (!panNumber || !validatePAN(panNumber)) {
        showFieldError('businessPanNumber', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
        isValid = false;
    }


    if (!agreeTerms) {
        showError('Please agree to the Terms & Conditions');
        isValid = false;
    }

    if (!agreeConsent) {
        showError('Please agree to the consent for information sharing');
        isValid = false;
    }

    return isValid;
}

function validatePersonalDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';
    const employmentSubType = formData.employmentSubType || 'salaried';

    if (employmentType === 'non-individual' || 
        (employmentType === 'individual' && 
         (employmentSubType === 'llp-partnership' || employmentSubType === 'private-limited'))) {
        return validateNonIndividualPersonalDetails();
    } else {
        return validateIndividualPersonalDetails();
    }
}

function validateIndividualPersonalDetails() {
    const address1 = document.getElementById('address1').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value;
    const pinCode = document.getElementById('pinCode').value.trim();
    const dob = document.getElementById('dob').value;
    const fatherName = document.getElementById('fatherName').value.trim();
    const aadharNumber = document.getElementById('aadharNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const gender = document.getElementById('gender').value;
    const existingCustomer = document.getElementById('existingCustomer').value;
    const cifNumber = document.getElementById('cifNumber').value.trim();
    const residenceType = document.getElementById('residenceType').value;
    const yearsAtResidence = document.getElementById('yearsAtResidence').value;

    let isValid = true;

    if (!address1) {
        showFieldError('address1', 'Please enter your address line 1');
        isValid = false;
    }

    if (!city) {
        showFieldError('city', 'Please enter your city');
        isValid = false;
    }

    if (!state) {
        showFieldError('state', 'Please select your state');
        isValid = false;
    }

    if (!pinCode || !validatePinCode(pinCode)) {
        showFieldError('pinCode', 'Please enter a valid 6-digit PIN code');
        isValid = false;
    }

    if (!dob) {
        showFieldError('dob', 'Please select your date of birth');
        isValid = false;
    }

    if (!fatherName) {
        showFieldError('fatherName', 'Please enter your father\'s name');
        isValid = false;
    }

    if (!aadharNumber || !validateAadhar(aadharNumber)) {
        showFieldError('aadharNumber', 'Please enter a valid 12-digit Aadhar number');
        isValid = false;
    }

    if (!email || !validateEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    if (!gender) {
        showFieldError('gender', 'Please select your gender');
        isValid = false;
    }

    if (!existingCustomer) {
        showFieldError('existingCustomer', 'Please specify if you are an existing customer');
        isValid = false;
    }

    if (existingCustomer === 'yes' && !cifNumber) {
        showFieldError('cifNumber', 'Please enter your CIF number');
        isValid = false;
    }

    if (!residenceType) {
        showFieldError('residenceType', 'Please select your residence type');
        isValid = false;
    }

    if (!yearsAtResidence || parseFloat(yearsAtResidence) < 0) {
        showFieldError('yearsAtResidence', 'Please enter valid years at current residence');
        isValid = false;
    }

    return isValid;
}

function validateNonIndividualPersonalDetails() {
    const companyName = document.getElementById('companyName').value.trim();
    const companyAddress1 = document.getElementById('companyAddress1').value.trim();
    const companyCity = document.getElementById('companyCity').value.trim();
    const companyState = document.getElementById('companyState').value;
    const companyPinCode = document.getElementById('companyPinCode').value.trim();
    const gstNumber = document.getElementById('gstNumber').value.trim();
    const panNumberCompany = document.getElementById('panNumberCompany').value.trim();
    const cinLlpNumber = document.getElementById('cinLlpNumber').value.trim();
    const directorName1 = document.getElementById('directorName1').value.trim();
    const existingCustomerCompany = document.getElementById('existingCustomerCompany').value;
    const cifNumberCompany = document.getElementById('cifNumberCompany').value.trim();

    let isValid = true;

    if (!companyName) {
        showFieldError('companyName', 'Please enter company name');
        isValid = false;
    }

    if (!companyAddress1) {
        showFieldError('companyAddress1', 'Please enter company address line 1');
        isValid = false;
    }

    if (!companyCity) {
        showFieldError('companyCity', 'Please enter city');
        isValid = false;
    }

    if (!companyState) {
        showFieldError('companyState', 'Please select state');
        isValid = false;
    }

    if (!companyPinCode || !validatePinCode(companyPinCode)) {
        showFieldError('companyPinCode', 'Please enter a valid 6-digit PIN code');
        isValid = false;
    }

    if (!gstNumber || !validateGSTNumber(gstNumber)) {
        showFieldError('gstNumber', 'Please enter a valid GST number');
        isValid = false;
    }

    if (!panNumberCompany || !validatePAN(panNumberCompany)) {
        showFieldError('panNumberCompany', 'Please enter a valid PAN number');
        isValid = false;
    }

    if (!cinLlpNumber) {
        showFieldError('cinLlpNumber', 'Please enter CIN/LLP number');
        isValid = false;
    }

    if (!directorName1) {
        showFieldError('directorName1', 'Please enter at least one director/partner name');
        isValid = false;
    }

    if (!existingCustomerCompany) {
        showFieldError('existingCustomerCompany', 'Please specify if existing customer');
        isValid = false;
    }

    if (existingCustomerCompany === 'yes' && !cifNumberCompany) {
        showFieldError('cifNumberCompany', 'Please enter CIF number');
        isValid = false;
    }

    return isValid;
}

function validateIncomeDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        return validateNonIndividualIncomeDetails();
    } else {
        return validateIndividualIncomeDetails();
    }
}

function validateIndividualIncomeDetails() {
    const employerName = document.getElementById('employerName').value.trim();
    const grossMonthlyIncome = document.getElementById('grossMonthlyIncome').value;
    const totalMonthlyObligation = document.getElementById('totalMonthlyObligation').value;
    const yearsAtEmployer = document.getElementById('yearsAtEmployer').value;
    const officialEmailID = document.getElementById('officialEmailID').value.trim();

    let isValid = true;

    if (!employerName) {
        showFieldError('employerName', 'Please enter your employer name');
        isValid = false;
    }

    if (!grossMonthlyIncome || parseFloat(grossMonthlyIncome) <= 0) {
        showFieldError('grossMonthlyIncome', 'Please enter a valid gross monthly income');
        isValid = false;
    }

    if (!totalMonthlyObligation || parseFloat(totalMonthlyObligation) < 0) {
        showFieldError('totalMonthlyObligation', 'Please enter valid total monthly obligation');
        isValid = false;
    }

    if (!yearsAtEmployer || parseFloat(yearsAtEmployer) < 0) {
        showFieldError('yearsAtEmployer', 'Please enter valid years at current employer');
        isValid = false;
    }

    if (!officialEmailID || !validateEmail(officialEmailID)) {
        showFieldError('officialEmailID', 'Please enter a valid official email address');
        isValid = false;
    }

    return isValid;
}

function validateNonIndividualIncomeDetails() {
    const gstAnnualTurnover = document.getElementById('gstAnnualTurnover').value;
    const grossAnnualIncome = document.getElementById('grossAnnualIncome').value;
    const otherAnnualIncome = document.getElementById('otherAnnualIncome').value;
    const currentEMI = document.getElementById('currentEMI').value;
    const yearsInBusiness = document.getElementById('yearsInBusiness').value;

    let isValid = true;

    if (!gstAnnualTurnover || parseFloat(gstAnnualTurnover) <= 0) {
        showFieldError('gstAnnualTurnover', 'Please enter valid GST annual turnover');
        isValid = false;
    }

    if (!grossAnnualIncome || parseFloat(grossAnnualIncome) <= 0) {
        showFieldError('grossAnnualIncome', 'Please enter a valid gross annual income');
        isValid = false;
    }

    if (!currentEMI || parseFloat(currentEMI) < 0) {
        showFieldError('currentEMI', 'Please enter valid current EMI');
        isValid = false;
    }

    if (!yearsInBusiness || parseFloat(yearsInBusiness) < 0) {
        showFieldError('yearsInBusiness', 'Please enter valid years in business');
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.parentElement.classList.add('error');

        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentElement.appendChild(errorElement);
    }
}

function clearFieldErrors() {
    const errorFields = document.querySelectorAll('.form-group.error');
    errorFields.forEach(field => {
        field.classList.remove('error');
        const errorMessage = field.querySelector('.field-error');
        if (errorMessage) errorMessage.remove();
    });

    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}


// Data persistence functions
function saveFormData() {
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        if (input.type !== 'checkbox') {
            formData[input.id] = input.value;
        } else {
            formData[input.id] = input.checked;
        }
    });

    localStorage.setItem('loanApplicationData', JSON.stringify(formData));
}

function saveSelectionData() {
    const selections = {};
    const activeButtons = document.querySelectorAll('.selection-btn.active');
    activeButtons.forEach(button => {
        const group = button.closest('.selection-group');
        const label = group.querySelector('label').textContent.toLowerCase().replace(/\s+/g, '_');
        selections[label] = button.dataset.value;

        // Track employment sub-type
        if (label.includes('employment_sub_type')) {
            selectedEmploymentSubType = button.dataset.value;
        }
    });

    formData.selections = selections;
    localStorage.setItem('loanApplicationData', JSON.stringify(formData));
}

function loadSavedData() {
    const savedData = localStorage.getItem('loanApplicationData');
    if (savedData) {
        formData = JSON.parse(savedData);

        // Restore form values
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type !== 'checkbox') {
                    element.value = formData[key];
                } else {
                    element.checked = formData[key];
                }
            }
        });

        // Restore selections
        if (formData.selections) {
            Object.keys(formData.selections).forEach(groupKey => {
                const value = formData.selections[groupKey];
                const button = document.querySelector(`[data-value="${value}"]`);
                if (button) {
                    const group = button.closest('.selection-group');
                    const buttons = group.querySelectorAll('.selection-btn');
                    buttons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Restore employment sub-type
                    if (groupKey.includes('employment_sub_type')) {
                        selectedEmploymentSubType = value;
                    }
                }
            });

            // Update employment sub-type and document visibility after restoring selections
            updateEmploymentSubTypeVisibility();
            updateDocumentVisibility();
        }
    }
}

// Utility functions
function resetApplication() {
    localStorage.removeItem('loanApplicationData');
    formData = {
        loanAmount: 1000000,
        interestRate: 8.5,
        tenure: 84
    };
    uploadedDocuments = {};
    currentStep = 0; // Start with loan selection
    updateStepDisplay();

    // Reset forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());

    // Reset selections
    const activeButtons = document.querySelectorAll('.selection-btn.active');
    activeButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Reset upload boxes
    const uploadBoxes = document.querySelectorAll('.upload-box');
    uploadBoxes.forEach(box => {
        box.classList.remove('uploaded');
        const statusElement = box.querySelector('.upload-status');
        if (statusElement) statusElement.textContent = '';
        const button = box.querySelector('.upload-btn');
        if (button) {
            button.textContent = 'Upload';
            button.style.backgroundColor = '#ff9800';
        }
    });
}

function showLoanSelection() {
    currentStep = 0;
    updateStepDisplay();
}

function showDocumentUpload() {
    if (currentStep < 5) {
        currentStep = 5;
        updateStepDisplay();
    }
}

function showFinalApproval() {
    currentStep = 6;
    updateStepDisplay();
}

// New document verification system with different flows
function showDocumentVerificationPopup(documentType, documentId) {
    let popupContent = '';

    switch(documentType) {
        case 'bankStatement':
            popupContent = `
                <div class="verification-popup">
                    <h3>📊 Bank Statement Verification</h3>
                    <div class="upload-section">
                        <div class="upload-area" id="upload-area-${documentId}">
                            <div class="upload-icon">📄</div>
                            <p>Upload PDF file only</p>
                            <button type="button" class="upload-file-btn" onclick="selectPDFFile('${documentId}')">Choose PDF File</button>
                        </div>
                        <div class="upload-status" id="upload-status-${documentId}"></div>
                    </div>
                    <div class="basic-details-form" id="form-${documentId}" style="display: none;">
                        <h4>Fill Basic Details</h4>
                        <div class="form-group">
                            <label>Account Number *</label>
                            <input type="text" id="accountNumber-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Bank Name *</label>
                            <input type="text" id="bankName-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>IFSC Code *</label>
                            <input type="text" id="ifscCode-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Account Type *</label>
                            <select id="accountType-${documentId}" required>
                                <option value="">Select Account Type</option>
                                <option value="savings">Savings</option>
                                <option value="current">Current</option>
                                <option value="salary">Salary</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'gstDoc':
            popupContent = `
                <div class="verification-popup">
                    <h3>🏢 GST Certificate Verification</h3>
                    <div class="upload-section">
                        <div class="upload-area" id="upload-area-${documentId}">
                            <div class="upload-icon">📄</div>
                            <p>Upload PDF file only</p>
                            <button type="button" class="upload-file-btn" onclick="selectPDFFile('${documentId}')">Choose PDF File</button>
                        </div>
                        <div class="upload-status" id="upload-status-${documentId}"></div>
                    </div>
                    <div class="basic-details-form" id="form-${documentId}" style="display: none;">
                        <h4>Fill Basic Details</h4>
                        <div class="form-group">
                            <label>GST Number *</label>
                            <input type="text" id="gstNumber-${documentId}" required placeholder="22AAAAA0000A1Z5">
                        </div>
                        <div class="form-group">
                            <label>Business Name *</label>
                            <input type="text" id="businessName-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Registration Date *</label>
                            <input type="date" id="registrationDate-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Business Type *</label>
                            <select id="businessType-${documentId}" required>
                                <option value="">Select Business Type</option>
                                <option value="proprietorship">Proprietorship</option>
                                <option value="partnership">Partnership</option>
                                <option value="private-limited">Private Limited</option>
                                <option value="public-limited">Public Limited</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'itrDoc':
            popupContent = `
                <div class="verification-popup">
                    <h3>📋 ITR Document Verification</h3>
                    <div class="verification-method-selection">
                        <h4>Choose Verification Method</h4>
                        <div class="method-buttons">
                            <button type="button" class="method-btn" onclick="selectITRMethod('fetch', '${documentId}')">
                                <div class="method-icon">🔄</div>
                                <span>Fetch</span>
                            </button>
                            <button type="button" class="method-btn" onclick="selectITRMethod('upload', '${documentId}')">
                                <div class="method-icon">📤</div>
                                <span>Upload</span>
                            </button>
                        </div>
                    </div>

                    <div class="fetch-section" id="fetch-section-${documentId}" style="display: none;">
                        <h4>Fetch ITR Details</h4>
                        <div class="form-row">
                            <div class="form-group half">
                                <label>User ID *</label>
                                <input type="text" id="userId-${documentId}" required>
                            </div>
                            <div class="form-group half">
                                <label>Password *</label>
                                <input type="password" id="password-${documentId}" required>
                            </div>
                        </div>
                    </div>

                    <div class="upload-section" id="upload-section-${documentId}" style="display: none;">
                        <div class="upload-area" id="upload-area-${documentId}">
                            <div class="upload-icon">📄</div>
                            <p>Upload PDF file only</p>
                            <button type="button" class="upload-file-btn" onclick="selectPDFFile('${documentId}')">Choose PDF File</button>
                        </div>
                        <div class="upload-status" id="upload-status-${documentId}"></div>
                        <div class="basic-details-form" id="form-${documentId}" style="display: none;">
                            <h4>Fill Basic Details</h4>
                            <div class="form-group">
                                <label>Assessment Year *</label>
                                <input type="text" id="assessmentYear-${documentId}" required placeholder="2023-24">
                            </div>
                            <div class="form-group">
                                <label>Gross Income *</label>
                                <input type="number" id="grossIncome-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Net Income *</label>
                                <input type="number" id="netIncome-${documentId}" required>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'dealerInvoice':
            popupContent = `
                <div class="verification-popup">
                    <h3>🚗 Dealer Invoice Verification</h3>
                    <div class="upload-section">
                        <div class="upload-area" id="upload-area-${documentId}">
                            <div class="upload-icon">📄</div>
                            <p>Upload PDF file only</p>
                            <button type="button" class="upload-file-btn" onclick="selectPDFFile('${documentId}')">Choose PDF File</button>
                        </div>
                        <div class="upload-status" id="upload-status-${documentId}"></div>
                    </div>

                    <div class="car-type-selection" id="car-type-${documentId}" style="display: none;">
                        <h4>Select Car Type</h4>
                        <div class="car-type-checkboxes">
                            <label class="checkbox-label">
                                <input type="radio" name="carType-${documentId}" value="pre-owned" onchange="handleCarTypeSelection('${documentId}', 'pre-owned')">
                                <span class="checkbox-custom"></span>
                                Pre-owned
                            </label>
                            <label class="checkbox-label">
                                <input type="radio" name="carType-${documentId}" value="new" onchange="handleCarTypeSelection('${documentId}', 'new')">
                                <span class="checkbox-custom"></span>
                                New
                            </label>
                        </div>
                    </div>

                    <div class="fuel-type-selection" id="fuel-type-${documentId}" style="display: none;">
                        <h4>Select Fuel Type</h4>
                        <div class="fuel-type-checkboxes">
                            <label class="checkbox-label">
                                <input type="radio" name="fuelType-${documentId}" value="petrol-diesel" onchange="handleFuelTypeSelection('${documentId}', 'petrol-diesel')">
                                <span class="checkbox-custom"></span>
                                Petrol/Diesel
                            </label>
                            <label class="checkbox-label">
                                <input type="radio" name="fuelType-${documentId}" value="ev" onchange="handleFuelTypeSelection('${documentId}', 'ev')">
                                <span class="checkbox-custom"></span>
                                EV
                            </label>
                        </div>
                    </div>

                    <div class="basic-details-form" id="form-${documentId}" style="display: none;">
                        <h4>Fill Basic Details</h4>

                        <!-- Basic Invoice Information -->
                        <div class="form-row">
                            <div class="form-group half">
                                <label>Invoice Number *</label>
                                <input type="text" id="invoiceNumber-${documentId}" required>
                            </div>
                            <div class="form-group half">
                                <label>Invoice Date *</label>
                                <input type="date" id="invoiceDate-${documentId}" required>
                            </div>
                        </div>

                        <!-- Dealer Information -->
                        <div class="form-group">
                            <label>Dealer Name *</label>
                            <input type="text" id="dealerName-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Dealer Address *</label>
                            <textarea id="dealerAddress-${documentId}" required placeholder="Enter complete dealer address" rows="3"></textarea>
                        </div>

                        <!-- Vehicle Information -->
                        <div class="form-group">
                            <label>Vehicle Model *</label>
                            <input type="text" id="vehicleModel-${documentId}" required>
                        </div>

                        <!-- Cost Breakdown -->
                        <div class="form-row">
                            <div class="form-group half">
                                <label>Ex-showroom Cost *</label>
                                <input type="number" id="exShowroomCost-${documentId}" step="0.01" required>
                            </div>
                            <div class="form-group half">
                                <label>Registration</label>
                                <input type="number" id="registration-${documentId}" step="0.01" value="0">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group half">
                                <label>Insurance</label>
                                <input type="number" id="insurance-${documentId}" step="0.01" value="0">
                            </div>
                            <div class="form-group half">
                                <label>Discount</label>
                                <input type="number" id="discount-${documentId}" step="0.01" value="0">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group half">
                                <label>Exchange Amount</label>
                                <input type="number" id="exchangeAmount-${documentId}" step="0.01" value="0">
                            </div>
                            <div class="form-group half">
                                <label>Accessories & Others</label>
                                <input type="number" id="accessories-${documentId}" step="0.01" value="0">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group half">
                                <label>Other Taxes/GST & Others</label>
                                <input type="number" id="otherTaxes-${documentId}" step="0.01" value="0">
                            </div>
                            <div class="form-group half">
                                <label>Installation Fee</label>
                                <input type="number" id="installationFee-${documentId}" step="0.01" value="0">
                            </div>
                        </div>

                        <!-- Total Invoice Value -->
                        <div class="form-group">
                            <label>Total Invoice Value *</label>
                            <input type="number" id="totalInvoiceValue-${documentId}" step="0.01" required readonly>
                        </div>
                    </div>
                </div>
            `;
            break;
    }

    const modal = document.createElement('div');
    modal.className = 'verification-modal';
    modal.id = `verification-modal-${documentId}`;
    modal.innerHTML = `
        <div class="verification-modal-content">
            <span class="close-verification" onclick="closeVerificationPopup('${documentId}')">&times;</span>
            ${popupContent}
            <div class="verification-actions">
                <button type="button" class="cancel-verification-btn" onclick="closeVerificationPopup('${documentId}')">Cancel</button>
                <button type="button" class="verify-document-btn" id="verify-btn-${documentId}" onclick="verifyDocument('${documentId}', '${documentType}')" ${documentType === 'itrDoc' ? 'style="display: none;"' : ''}>Verify</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Add drag and drop functionality for upload areas
    if (documentType !== 'itrDoc') {
        setupDragAndDrop(documentId);
    }
}

function setupDragAndDrop(documentId) {
    const uploadArea = document.getElementById(`upload-area-${documentId}`);

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0], documentId);
        }
    });
}

// Legacy function for compatibility
function selectFile(documentId) {
    selectPDFFile(documentId);
}

// Updated file selection for PDF only
function selectPDFFile(documentId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            handlePDFFileSelection(file, documentId);
        }
    };
    input.click();
}

// Handle PDF file selection and OCR simulation
function handlePDFFileSelection(file, documentId) {
    // Validate file type
    if (file.type !== 'application/pdf') {
        showError('Please upload a PDF file only');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('File size should not exceed 5MB');
        return;
    }

    const uploadStatus = document.getElementById(`upload-status-${documentId}`);
    uploadStatus.innerHTML = `
        <div class="file-uploaded">
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        </div>
    `;

    // Store file for later processing
    window.tempUploadedFiles = window.tempUploadedFiles || {};
    window.tempUploadedFiles[documentId] = file;

    // Simulate OCR processing
    showLoading();
    setTimeout(() => {
        hideLoading();

        // Show OCR extracted information (simulated)
        showOCRExtractedInfo(documentId);

        // Show basic details form based on document type
        showBasicDetailsForm(documentId);

        showSuccess('PDF uploaded and verified successfully!');
    }, 2000);
}

// Show OCR extracted information
function showOCRExtractedInfo(documentId) {
    const uploadStatus = document.getElementById(`upload-status-${documentId}`);
    const ocrInfo = `
        <div class="ocr-extracted-info">
            <h4>OCR Extracted Information</h4>
            <div class="extracted-data">
                <div class="extracted-item">
                    <span class="label">Document Type:</span>
                    <span class="value">PDF Document</span>
                </div>
                <div class="extracted-item">
                    <span class="label">Pages:</span>
                    <span class="value">1</span>
                </div>
                <div class="extracted-item">
                    <span class="label">OCR Status:</span>
                    <span class="value">✓ Processed</span>
                </div>
            </div>
        </div>
    `;

    uploadStatus.innerHTML += ocrInfo;
}

// Show basic details form after PDF upload
function showBasicDetailsForm(documentId) {
    const form = document.getElementById(`form-${documentId}`);
    if (form) {
        form.style.display = 'block';
    }

    // For dealer invoice, show car type selection instead of basic form initially
    if (documentId === 'dealerInvoice') {
        const carTypeSection = document.getElementById(`car-type-${documentId}`);
        if (carTypeSection) {
            carTypeSection.style.display = 'block';
        }
        if (form) {
            form.style.display = 'none';
        }

        // Setup auto-calculation for dealer invoice when form is shown later
        setTimeout(() => {
            setupDealerInvoiceCalculation(documentId);
        }, 100);
    }

    // Show verify button
    const verifyBtn = document.getElementById(`verify-btn-${documentId}`);
    if (verifyBtn && documentId !== 'dealerInvoice') {
        verifyBtn.style.display = 'inline-block';
    }
}

// Setup auto-calculation for dealer invoice total
function setupDealerInvoiceCalculation(documentId) {
    const costFields = [
        `exShowroomCost-${documentId}`,
        `registration-${documentId}`,
        `insurance-${documentId}`,
        `discount-${documentId}`,
        `exchangeAmount-${documentId}`,
        `accessories-${documentId}`,
        `otherTaxes-${documentId}`,
        `installationFee-${documentId}`
    ];

    const totalField = document.getElementById(`totalInvoiceValue-${documentId}`);

    function calculateTotal() {
        const exShowroom = parseFloat(document.getElementById(`exShowroomCost-${documentId}`)?.value || 0);
        const registration = parseFloat(document.getElementById(`registration-${documentId}`)?.value || 0);
        const insurance = parseFloat(document.getElementById(`insurance-${documentId}`)?.value || 0);
        const discount = parseFloat(document.getElementById(`discount-${documentId}`)?.value || 0);
        const exchange = parseFloat(document.getElementById(`exchangeAmount-${documentId}`)?.value || 0);
        const accessories = parseFloat(document.getElementById(`accessories-${documentId}`)?.value || 0);
        const otherTaxes = parseFloat(document.getElementById(`otherTaxes-${documentId}`)?.value || 0);
        const installationFee = parseFloat(document.getElementById(`installationFee-${documentId}`)?.value || 0);

        // Calculate total: ex-showroom + registration + insurance + accessories + taxes + installation - discount - exchange
        const total = exShowroom + registration + insurance + accessories + otherTaxes + installationFee - discount - exchange;

        if (totalField) {
            totalField.value = total.toFixed(2);
        }
    }

    // Add event listeners to all cost fields
    costFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', calculateTotal);
            field.addEventListener('change', calculateTotal);
        }
    });
}

// ITR method selection
function selectITRMethod(method, documentId) {
    const fetchSection = document.getElementById(`fetch-section-${documentId}`);
    const uploadSection = document.getElementById(`upload-section-${documentId}`);
    const verifyBtn = document.getElementById(`verify-btn-${documentId}`);

    if (method === 'fetch') {
        fetchSection.style.display = 'block';
        uploadSection.style.display = 'none';
        verifyBtn.style.display = 'inline-block';
        verifyBtn.setAttribute('data-method', 'fetch');
    } else {
        fetchSection.style.display = 'none';
        uploadSection.style.display = 'block';
        verifyBtn.style.display = 'none';
        verifyBtn.setAttribute('data-method', 'upload');
        setupDragAndDrop(documentId);
    }
}

// Handle car type selection
function handleCarTypeSelection(documentId, carType) {
    if (carType === 'pre-owned') {
        // Show contact branch notification
        showContactBranchNotification();
    } else if (carType === 'new') {
        // Show fuel type selection
        const fuelTypeSection = document.getElementById(`fuel-type-${documentId}`);
        if (fuelTypeSection) {
            fuelTypeSection.style.display = 'block';
        }
    }
}

// Handle fuel type selection
function handleFuelTypeSelection(documentId, fuelType) {
    // Show basic details form (without chassis number)
    const form = document.getElementById(`form-${documentId}`);
    if (form) {
        form.style.display = 'block';

        // Setup auto-calculation for dealer invoice
        if (documentId === 'dealerInvoice') {
            setupDealerInvoiceCalculation(documentId);
        }
    }

    // Show verify button
    const verifyBtn = document.getElementById(`verify-btn-${documentId}`);
    if (verifyBtn) {
        verifyBtn.style.display = 'inline-block';
    }
}

// Show contact branch notification
function showContactBranchNotification() {
    const modal = document.createElement('div');
    modal.className = 'notification-modal';
    modal.id = 'contactBranchModal';
    modal.innerHTML = `
        <div class="notification-modal-content">
            <div class="notification-header">
                <h3>📞 Contact Branch Required</h3>
            </div>
            <div class="notification-body">
                <p>For pre-owned vehicles, please contact our branch for further assistance.</p>
                <div class="branch-contact">
                    <p><strong>Contact Details:</strong></p>
                    <p>📞 Phone: +91-1234567890</p>
                    <p>📧 Email: support@tjsbbank.com</p>
                    <p>🕒 Working Hours: 9:00 AM - 6:00 PM</p>
                    <p>📍 Address: TJSB Bank Branch Office</p>
                </div>
            </div>
            <div class="notification-actions">
                <button class="contact-branch-btn" onclick="contactBranch()">Contact Branch</button>
                <button class="close-notification-btn" onclick="closeContactBranchModal()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Close contact branch modal
function closeContactBranchModal() {
    const modal = document.getElementById('contactBranchModal');
    if (modal) {
        modal.remove();
    }
}

// Contact branch action
function contactBranch() {
    showNotification('📞 Redirecting to contact page...', 'success');
    closeContactBranchModal();
    // Here you can add actual contact functionality
}

function handleFileSelection(file, documentId) {
    // This function is now replaced by handlePDFFileSelection
    // Redirect to the new function for consistency
    handlePDFFileSelection(file, documentId);
}

function verifyDocument(documentId, documentType) {
    let isValid = true;
    let formData = {};
    let file = null;

    // Handle different document types and methods
    if (documentType === 'itrDoc') {
        const verifyBtn = document.getElementById(`verify-btn-${documentId}`);
        const method = verifyBtn.getAttribute('data-method');

        if (method === 'fetch') {
            // Validate fetch fields
            const userId = document.getElementById(`userId-${documentId}`);
            const password = document.getElementById(`password-${documentId}`);

            if (!userId.value.trim() || !password.value.trim()) {
                showError('Please fill User ID and Password');
                return;
            }

            formData = {
                userId: userId.value,
                password: password.value,
                method: 'fetch'
            };
        } else {
            // Validate upload fields
            file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
            if (!file) {
                showError('Please upload a PDF file first');
                return;
            }

            const form = document.getElementById(`form-${documentId}`);
            const requiredFields = form.querySelectorAll('[required]');

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#ddd';
                    formData[field.id.replace(`-${documentId}`, '')] = field.value;
                }
            });

            if (!isValid) {
                showError('Please fill all required fields');
                return;
            }

            formData.method = 'upload';
        }
    } else {
        // For other document types, check file upload first
        file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
        if (!file) {
            showError('Please upload a PDF file first');
            return;
        }

        // For dealer invoice, check if car type selection is made
        if (documentType === 'dealerInvoice') {
            const carTypeSelected = document.querySelector(`input[name="carType-${documentId}"]:checked`);
            if (!carTypeSelected) {
                showError('Please select car type');
                return;
            }

            if (carTypeSelected.value === 'new') {
                const fuelTypeSelected = document.querySelector(`input[name="fuelType-${documentId}"]:checked`);
                if (!fuelTypeSelected) {
                    showError('Please select fuel type');
                    return;
                }
                formData.carType = carTypeSelected.value;
                formData.fuelType = fuelTypeSelected.value;
            } else {
                formData.carType = carTypeSelected.value;
            }
        }

        // Validate form fields
        const form = document.getElementById(`form-${documentId}`);
        if (form.style.display !== 'none') {
            const requiredFields = form.querySelectorAll('[required]');

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#ddd';
                    formData[field.id.replace(`-${documentId}`, '')] = field.value;
                }
            });

            if (!isValid) {
                showError('Please fill all required fields');
                return;
            }
        }
    }

    // Show loading
    showLoading();

    // Simulate verification process
    setTimeout(() => {
        hideLoading();

        // Generate verification ID
        const verificationId = generateVerificationId(documentType);

        // Store document data
        uploadedDocuments[documentId] = {
            name: file ? file.name : 'ITR Fetch Data',
            size: file ? file.size : 0,
            type: file ? file.type : 'application/json',
            uploadDate: new Date(),
            fileURL: file ? URL.createObjectURL(file) : null,
            file: file,
            verified: true,
            verificationId: verificationId,
            formData: formData
        };

        // Update UI
        updateDocumentStatus(documentId, documentType, verificationId);

        // Close popup
        closeVerificationPopup(documentId);

        // Check if all documents are uploaded
        checkAllDocumentsUploaded();

        showSuccess(`${getDocumentDisplayName(documentType)} verified successfully! ID: ${verificationId}`);
    }, 2000);
}

function generateVerificationId(documentType) {
    const prefix = {
        'bankStatement': 'BS',
        'gstDoc': 'GST',
        'itrDoc': 'ITR',
        'dealerInvoice': 'DI'
    };

    const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix[documentType]}${randomNumber}`;
}

function getDocumentDisplayName(documentType) {
    const names = {
        'bankStatement': 'Bank Statement',
        'gstDoc': 'GST Certificate',
        'itrDoc': 'ITR Document',
        'dealerInvoice': 'Dealer Invoice'
    };
    return names[documentType] || 'Document';
}

function updateDocumentStatus(documentId, documentType, verificationId) {
    const uploadBox = document.getElementById(documentId);
    uploadBox.classList.add('uploaded');

    const uploadBtn = uploadBox.querySelector('.upload-btn');
    uploadBtn.textContent = '✓ Verified';
    uploadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    uploadBtn.style.color = 'white';
    uploadBtn.style.border = 'none';
    uploadBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
    uploadBtn.disabled = true;

    const statusElement = uploadBox.querySelector('.upload-status');
    statusElement.innerHTML = `
        <div class="verification-success">
            <div class="success-info">
                <span class="success-check">✅</span>
                <span class="verification-id">ID: ${verificationId}</span>
            </div>
            <div class="document-actions">
                <button class="view-document-btn" onclick="viewUploadedDocument('${documentId}')">
                    👁️ View
                </button>
            </div>
        </div>
    `;
}

function viewUploadedDocument(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found');
        return;
    }

    showDocumentPreview(documentId);
}

function closeVerificationPopup(documentId) {
    const modal = document.getElementById(`verification-modal-${documentId}`);
    if (modal) {
        modal.remove();
    }

    // Clean up temp files
    if (window.tempUploadedFiles && window.tempUploadedFiles[documentId]) {
        delete window.tempUploadedFiles[documentId];
    }
}

function processFileUpload(file, documentId, uploadType, buttonElement) {
    showLoading();

    // Create file URL for preview
    const fileURL = URL.createObjectURL(file);

    // Simulate upload process
    setTimeout(() => {
        hideLoading();

        // Mark as uploaded with file URL for preview
        uploadedDocuments[documentId] = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date(),
            fileURL: fileURL,
            file: file
        };

        // Update UI
        const uploadBox = document.getElementById(documentId);
        uploadBox.classList.add('uploaded');

        const statusElement = uploadBox.querySelector('.upload-status');
        statusElement.innerHTML = `
            <div class="upload-success">
                <span class="success-check">✓</span>
                <span class="file-name">${file.name}</span>
                <button class="preview-btn" onclick="showDocumentPreview('${documentId}')">
                    👁️ Preview
                </button>
            </div>
        `;

        // Add verification buttons for different documents
        if (documentId === 'bankStatement') {
            statusElement.innerHTML += `
                <button class="verify-bank-btn" onclick="showBankVerificationModal()">
                    Verify Bank Account
                </button>
            `;
        } else if (documentId === 'dealerInvoice') {
            statusElement.innerHTML += `
                <button class="verify-dealer-btn" onclick="showDealerVerificationModal()">
                    Verify Dealer Invoice
                </button>
            `;
        } else if (documentId === 'gstDoc') {
            statusElement.innerHTML += `
                <button class="verify-gst-btn" onclick="showGSTVerificationModal()">
                    Verify GST
                </button>
            `;
        } else if (documentId === 'itrDoc') {
            statusElement.innerHTML += `
                <button class="verify-itr-btn" onclick="showITRVerificationModal()">
                    Verify ITR
                </button>
            `;
        }

        if (buttonElement) {
            buttonElement.textContent = 'Re-upload';
            buttonElement.style.backgroundColor = '#28a745';
        }

        // Check if all documents are uploaded
        checkAllDocumentsUploaded();

        showSuccess(`${uploadType} uploaded successfully!`);
    }, 1500);
}

function checkAllDocumentsUploaded() {
    let requiredDocs = ['bankStatement', 'dealerInvoice', 'itrDoc'];

    // GST is required for business-related employment sub-types
    if (selectedEmploymentSubType === 'self-business' || 
        selectedEmploymentSubType === 'llp-partnership' || 
        selectedEmploymentSubType === 'private-limited') {
        requiredDocs.push('gstDoc');
    }

    const allUploaded = requiredDocs.every(docId => uploadedDocuments[docId]);

    const proceedButton = document.getElementById('proceedToApproval');
    if (proceedButton) {
        if (allUploaded) {
            proceedButton.style.backgroundColor = '#28a745';
            proceedButton.textContent = 'All Documents Uploaded - Proceed';
        } else {
            const missingCount = requiredDocs.filter(docId => !uploadedDocuments[docId]).length;
            proceedButton.style.backgroundColor = '#f44336';
            proceedButton.textContent = `Upload ${missingCount} more documents`;
        }
    }
}

// Upload handlers setup
function setupUploadHandlers() {
    const uploadButtons = document.querySelectorAll('.upload-btn');
    uploadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const uploadBox = this.closest('.upload-box');
            const uploadType = uploadBox.querySelector('h3').textContent;
            const documentId = uploadBox.id;
            handleDocumentUpload(documentId);
        });
    });
}

// Update income form visibility based on employment type
function updateIncomeFormVisibility() {
    const individualForm = document.getElementById('individual-income-form');
    const nonIndividualForm = document.getElementById('non-individual-income-form');

    if (!individualForm || !nonIndividualForm) return;

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select');
        nonIndividualInputs.forEach(input => {
            if (input.id !== 'otherAnnualIncome' && input.type !== 'readonly') {
                input.setAttribute('required', 'required');
            }
        });
    } else {
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select');
        individualInputs.forEach(input => {
            if (input.type !== 'readonly' && input.id !== 'bonusOvertimeArrear') {
                input.setAttribute('required', 'required');
            }
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update basic form visibility based on employment type
function updateBasicFormVisibility() {
    const individualForm = document.getElementById('individual-basic-form');
    const nonIndividualForm = document.getElementById('non-individual-basic-form');

    if (!individualForm || !nonIndividualForm) return;

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select');
        nonIndividualInputs.forEach(input => {
            input.setAttribute('required', 'required');
        });
    } else {
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select');
        individualInputs.forEach(input => {
            input.setAttribute('required', 'required');
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update personal form visibility based on employment type
function updatePersonalFormVisibility() {
    const individualForm = document.querySelector('#step-2 .form-container:not(#non-individual-personal-form)');
    const nonIndividualForm = document.getElementById('non-individual-personal-form');

    if (!individualForm || !nonIndividualForm) return;

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required], textarea[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select, textarea');
        nonIndividualInputs.forEach(input => {
            if (input.id !== 'cifNumberCompany' && input.id !== 'bureauScoreCompany') {
                input.setAttribute('required', 'required');
            }
        });
    } else {
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select, textarea');
        individualInputs.forEach(input => {
            if (input.id !== 'cifNumber' && input.id !== 'bureauScore' && input.id !== 'address2') {
                input.setAttribute('required', 'required');
            }
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required], textarea[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update employment sub-type visibility based on employment type
function updateEmploymentSubTypeVisibility() {
    const employmentType = formData.employmentType || 'individual';
    const employmentSubTypeButtons = document.querySelectorAll('.employment-sub-type-btn');

    employmentSubTypeButtons.forEach(button => {
        const buttonValue = button.dataset.value;

        if (employmentType === 'non-individual') {
            // For non-individual, only show LLP/Partnership and Private Limited
            if (buttonValue === 'llp-partnership' || buttonValue === 'private-limited') {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
                // Remove active class if hidden button was active
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                }
            }
        } else {
            // For individual, show all except LLP/Partnership and Private Limited
            if (buttonValue === 'llp-partnership' || buttonValue === 'private-limited') {
                button.style.display = 'none';
                // Remove active class if hidden button was active
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                }
            } else {
                button.style.display = 'block';
            }
        }
    });

    // If no employment sub-type is selected after filtering, select the first visible one
    const activeSubType = document.querySelector('.employment-sub-type-btn.active[style*="block"], .employment-sub-type-btn.active:not([style*="none"])');
    if (!activeSubType) {
        const firstVisible = document.querySelector('.employment-sub-type-btn[style*="block"], .employment-sub-type-btn:not([style*="none"])');
        if (firstVisible) {
            firstVisible.classList.add('active');
            selectedEmploymentSubType = firstVisible.dataset.value;
            formData.employmentSubType = firstVisible.dataset.value;
        }
    }

    updateDocumentVisibility();
}

// Update document visibility based on employment sub-type
function updateDocumentVisibility() {
    const gstDocument = document.getElementById('gstDocument');

    // Show GST document for business-related employment sub-types
    if (selectedEmploymentSubType === 'self-business' || 
        selectedEmploymentSubType === 'llp-partnership' || 
        selectedEmploymentSubType === 'private-limited') {
        if (gstDocument) gstDocument.style.display = 'block';
    } else {
        if (gstDocument) gstDocument.style.display = 'none';
    }

    // Update required documents check
    checkAllDocumentsUploaded();
}

// Call setup on DOM load
document.addEventListener('DOMContentLoaded', setupUploadHandlers);

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' && activeElement.type !== 'checkbox') {
            event.preventDefault();
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn && nextBtn.style.display !== 'none') {
                nextBtn.click();
            }
        }
    }
});

// Demo functions for testing
function simulateSteps() {
    // Fill demo data
    document.getElementById('fullName').value = 'John Doe';
    document.getElementById('mobile').value = '9876543210';
    document.getElementById('loanAmount').value = '500000';
    document.getElementById('panNumber').value = 'ABCDE1234F';
    document.getElementById('agreeOVD').checked = true;

    saveFormData();
    alert('Demo data filled. You can now navigate through the steps.');
}

// Auto-calculation setup
function setupAutoCalculations() {
    // Individual form calculations
    const grossIncomeInput = document.getElementById('grossMonthlyIncome');
    const bonusInput = document.getElementById('bonusOvertimeArrear');
    const totalIncomeInput = document.getElementById('totalIncome');
    const obligationInput = document.getElementById('totalMonthlyObligation');
    const netSalaryInput = document.getElementById('netMonthlySalary');

    function calculateTotals() {
        const grossIncome = parseFloat(grossIncomeInput?.value || 0);
        const bonus = parseFloat(bonusInput?.value || 0);
        const obligation = parseFloat(obligationInput?.value || 0);

        const totalIncome = grossIncome - bonus;
        const netSalary = totalIncome - obligation;

        if (totalIncomeInput) totalIncomeInput.value = totalIncome.toFixed(2);
        if (netSalaryInput) netSalaryInput.value = netSalary.toFixed(2);
    }

    [grossIncomeInput, bonusInput, obligationInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateTotals);
            input.addEventListener('change', calculateTotals);
        }
    });

    // Non-individual form calculations
    const grossAnnualInput = document.getElementById('grossAnnualIncome');
    const otherAnnualInput = document.getElementById('otherAnnualIncome');
    const netAnnualInput = document.getElementById('netAnnualIncome');

    function calculateAnnualTotals() {
        const grossAnnual = parseFloat(grossAnnualInput?.value || 0);
        const otherAnnual = parseFloat(otherAnnualInput?.value || 0);

        const netAnnual = grossAnnual + otherAnnual;

        if (netAnnualInput) netAnnualInput.value = netAnnual.toFixed(2);
    }

    [grossAnnualInput, otherAnnualInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateAnnualTotals);
            input.addEventListener('change', calculateAnnualTotals);
        }
    });
}

// Tenure slider setup
function setupTenureSlider() {
    const slider = document.getElementById('tenureSlider');
    const display = document.getElementById('tenureDisplay');
    const emiDisplay = document.getElementById('dynamicEMI');

    if (slider && display) {
        slider.addEventListener('input', function() {
            const tenure = parseInt(this.value);
            display.textContent = tenure;
            formData.tenure = tenure;
            calculateEMI();
        });
    }
}

// EMI Calculation
function calculateEMI() {
    const principal = formData.loanAmount || 1000000;
    const rate = (formData.interestRate || 8.5) / 100 / 12;
    const tenure = formData.tenure || 84;

    const emi = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);

    const emiDisplay = document.getElementById('dynamicEMI');
    if (emiDisplay) {
        emiDisplay.textContent = `Rs. ${Math.round(emi).toLocaleString('en-IN')} p.m.`;
    }

    // Update other displays
    const loanAmountDisplay = document.getElementById('displayLoanAmount');
    const interestRateDisplay = document.getElementById('displayInterestRate');

    if (loanAmountDisplay) {
        loanAmountDisplay.textContent = `${(principal / 100000).toFixed(1)} Lakhs`;
    }

    if (interestRateDisplay) {
        interestRateDisplay.textContent = formData.interestRate || '8.50';
    }
}

// Enhanced validation functions
function validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}

function validatePAN(pan) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

function validateAadhar(aadhar) {
    return /^\d{12}$/.test(aadhar.replace(/\s/g, ''));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePinCode(pinCode) {
    return /^\d{6}$/.test(pinCode);
}

function validateGSTNumber(gst) {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
}

// UI Helper functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.querySelector('.step-content:not([style*="display: none"])');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'error-message';
    successDiv.style.backgroundColor = '#d4edda';
    successDiv.style.color = '#155724';
    successDiv.style.borderColor = '#c3e6cb';
    successDiv.textContent = message;

    const container = document.querySelector('.step-content:not([style*="display: none"])');
    if (container) {
        container.insertBefore(successDiv, container.firstChild);
        setTimeout(() => successDiv.remove(), 3000);
    }
}

// Application date setup
function setApplicationDate() {
    const dateElement = document.getElementById('applicationDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-IN');
    }
}

// Thank you page functions
function showThankYou() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        currentStep = 7;
        updateStepDisplay();
    }, 2000);
}

// New function for loan acceptance
function acceptLoan() {
    showLoading();

    // Simulate processing
    setTimeout(() => {
        hideLoading();

        // Send notifications
        sendNotifications();

        // Show success message
        showNotification('🎉 Congratulations! Your loan has been approved. Notifications sent to your mobile and email.');

        // Move to thank you page
        setTimeout(() => {
            showThankYou();
        }, 3000);
    }, 2000);
}

// Download loan summary function
function downloadLoanSummary() {
    const loanData = {
        applicantName: formData.fullName || 'N/A',
        mobile: formData.mobile || 'N/A',
        email: formData.email || 'N/A',
        loanAmount: formData.loanAmount || 1000000,
        interestRate: formData.interestRate || 8.5,
        tenure: formData.tenure || 84,
        emi: calculateEMIValue(),
        applicationDate: new Date().toLocaleDateString('en-IN'),
        referenceNumber: 'LA2025082901'
    };

    const summaryText = `
LOAN APPLICATION SUMMARY
========================

Application Reference: ${loanData.referenceNumber}
Application Date: ${loanData.applicationDate}

APPLICANT DETAILS:
- Name: ${loanData.applicantName}
- Mobile: ${loanData.mobile}
- Email: ${loanData.email}

LOAN DETAILS:
- Loan Amount: Rs. ${loanData.loanAmount.toLocaleString('en-IN')}
- Rate of Interest: ${loanData.interestRate}% p.a.
- Tenure: ${loanData.tenure} months
- EMI: Rs. ${loanData.emi.toLocaleString('en-IN')} p.m.

CHARGES:
- Processing Charges: Rs. 1,180
- Login Fee + GST: Rs. 1,180

Status: IN-PRINCIPAL APPROVED

Thank you for choosing FinanceBank!
    `;

    // Create and download file
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan_summary_${loanData.referenceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification('📄 Loan summary downloaded successfully!');
}

// Send notifications function
function sendNotifications() {
    const mobile = formData.mobile || '9876543210';
    const email = formData.email || 'user@example.com';

    // Simulate SMS notification
    console.log(`SMS sent to ${mobile}: 🎉 Congratulations! Your loan application has been approved. Reference: LA2025082901. Visit our branch to complete formalities. - FinanceBank`);

    // Simulate Email notification
    console.log(`Email sent to ${email}: Your loan application has been approved! Please check your application portal for next steps. Reference: LA2025082901`);
}

function restartApplication() {
    if (confirm('Are you sure you want to start a new application? All current data will be lost.')) {
        resetApplication();
    }
}

function downloadSummary() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        alert('Application summary has been downloaded to your device.');
    }, 1500);
}

// Notification functions
function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const messageElement = toast.querySelector('.notification-message');
    const iconElement = toast.querySelector('.notification-icon');

    messageElement.textContent = message;

    // Set icon based on type
    if (type === 'success') {
        iconElement.textContent = '✅';
        toast.style.backgroundColor = '#d4edda';
        toast.style.borderColor = '#c3e6cb';
    } else if (type === 'error') {
        iconElement.textContent = '❌';
        toast.style.backgroundColor = '#f8d7da';
        toast.style.borderColor = '#f5c6cb';
    }

    toast.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const toast = document.getElementById('notificationToast');
    toast.style.display = 'none';
}

// Calculate EMI value for downloads
function calculateEMIValue() {
    const principal = formData.loanAmount || 1000000;
    const rate = (formData.interestRate || 8.5) / 100 / 12;
    const tenure = formData.tenure || 84;

    const emi = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
    return Math.round(emi);
}

// Update loan type button handlers
function updateLoanTypeHandlers() {
    const loanTypeButtons = document.querySelectorAll('.loan-type-btn');
    loanTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.selection-group');
            const buttons = group.querySelectorAll('.loan-type-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Handle loan type selection to show/hide sub-type
            if (this.dataset.value === 'vehicle') {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'block';
            } else {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'none';
            }
        });
    });
}

// Call update handlers on DOM load
document.addEventListener('DOMContentLoaded', updateLoanTypeHandlers);



// PDF Preview Functions
function showDocumentPreview(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found or preview not available');
        return;
    }

    // Store current document ID for download functionality
    window.currentPreviewDocId = documentId;

    const modal = document.getElementById('documentPreviewModal');
    const previewContent = document.getElementById('previewContent');
    const documentTitle = document.getElementById('documentTitle');

    // Set document title
    documentTitle.textContent = document.name;

    // Clear previous content
    previewContent.innerHTML = '';

    if (document.type === 'application/pdf') {
        // For PDF files, embed the PDF viewer with responsive sizing
        const embed = document.createElement('embed');
        embed.src = document.fileURL;
        embed.type = 'application/pdf';
        embed.style.width = '100%';
        embed.style.height = getResponsiveHeight();
        embed.style.borderRadius = '8px';
        embed.style.border = 'none';
        embed.style.minHeight = '400px';
        previewContent.appendChild(embed);
    } else if (document.type.startsWith('image/')) {
        // For image files, show the image with responsive sizing
        const img = document.createElement('img');
        img.src = document.fileURL;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = getResponsiveHeight();
        img.style.objectFit = 'contain';
        img.style.borderRadius = '8px';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.onload = function() {
            console.log('Image loaded successfully');
        };
        img.onerror = function() {
            console.error('Failed to load image');
            previewContent.innerHTML = '<p style="text-align: center; color: #666;">Failed to load image preview</p>';
        };
        previewContent.appendChild(img);
    } else {
        // For other file types, show a message
        const message = document.createElement('div');
        message.className = 'preview-message';
        message.innerHTML = `
            <div class="file-icon">📄</div>
            <h3>${document.name}</h3>
            <p>Preview not available for this file type</p>
            <p>Size: ${(document.size / 1024 / 1024).toFixed(2)} MB</p>
            <p>Click download to view the file</p>
        `;
        previewContent.appendChild(message);
    }

    modal.style.display = 'block';

    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

// Helper function to get responsive height for preview content
function getResponsiveHeight() {
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;

    if (screenWidth <= 480) {
        return Math.max(screenHeight * 0.6, 300) + 'px';
    } else if (screenWidth <= 768) {
        return Math.max(screenHeight * 0.7, 400) + 'px';
    } else {
        return Math.max(screenHeight * 0.75, 500) + 'px';
    }
}

function closeDocumentPreview() {
    const modal = document.getElementById('documentPreviewModal');
    modal.style.display = 'none';

    // Restore body scrolling when modal is closed
    document.body.style.overflow = 'auto';
}

function downloadDocument(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found');
        return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = document.fileURL;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`📥 ${document.name} downloaded successfully!`);
}

// Document upload preview function
function openDocumentPreview(documentType, fileName, documentId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('File size should not exceed 5MB');
                return;
            }

            // Get the upload button element
            const uploadBox = document.getElementById(documentId);
            const buttonElement = uploadBox ? uploadBox.querySelector('.upload-btn') : null;

            // Process all documents directly without verification
            processFileUpload(file, documentId, documentType, buttonElement);
        }
    };
    input.click();
}

// Bank verification system
function showBankVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'bankVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeBankVerificationModal()">&times;</span>
            <h3>Bank Account Verification</h3>
            <form id="bankVerificationForm">
                <div class="bank-form-group">
                    <label for="accountNumber">Account Number</label>
                    <input type="text" id="accountNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="confirmAccountNumber">Confirm Account Number</label>
                    <input type="text" id="confirmAccountNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="ifscCode">IFSC Code</label>
                    <input type="text" id="ifscCode" required>
                </div>
                <div class="bank-form-group">
                    <label for="bankName">Bank Name</label>
                    <input type="text" id="bankName" required>
                </div>
                <div class="bank-form-group">
                    <label for="accountHolderName">Account Holder Name</label>
                    <input type="text" id="accountHolderName" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeBankVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyBankAccount()">Verify Account</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeBankVerificationModal() {
    const modal = document.getElementById('bankVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyBankAccount() {
    const accountNumber = document.getElementById('accountNumber').value;
    const confirmAccountNumber = document.getElementById('confirmAccountNumber').value;
    const ifscCode = document.getElementById('ifscCode').value;
    const bankName = document.getElementById('bankName').value;
    const accountHolderName = document.getElementById('accountHolderName').value;

    // Validation
    if (!accountNumber || !confirmAccountNumber || !ifscCode || !bankName || !accountHolderName) {
        showError('Please fill all bank details');
        return;
    }

    if (accountNumber !== confirmAccountNumber) {
        showError('Account numbers do not match');
        return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        showError('Please enter a valid IFSC code');
        return;
    }

    showLoading();

    // Simulate bank verification
    setTimeout(() => {
        hideLoading();

        // Save bank details
        formData.bankDetails = {
            accountNumber,
            ifscCode,
            bankName,
            accountHolderName,
            verified: true
        };

        showSuccess('Bank account verified successfully!');
        closeBankVerificationModal();

        // Update bank statement upload to show verified status
        const bankStatementBox = document.getElementById('bankStatement');
        if (bankStatementBox) {
            const uploadBtn = bankStatementBox.querySelector('.upload-btn');
            if (uploadBtn) {
                uploadBtn.textContent = '✓ Verified';
                uploadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                uploadBtn.style.color = 'white';
                uploadBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                uploadBtn.disabled = true;
            }
        }
    }, 2000);
}

// Dealer Invoice Verification Modal
function showDealerVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'dealerVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeDealerVerificationModal()">&times;</span>
            <h3>Dealer Invoice Verification</h3>
            <form id="dealerVerificationForm">
                <div class="bank-form-group">
                    <label for="dealerName">Dealer Name</label>
                    <input type="text" id="dealerName" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceNumber">Invoice Number</label>
                    <input type="text" id="invoiceNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="vehicleModel">Vehicle Model</label>
                    <input type="text" id="vehicleModel" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceAmount">Invoice Amount</label>
                    <input type="number" id="invoiceAmount" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceDate">Invoice Date</label>
                    <input type="date" id="invoiceDate" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeDealerVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyDealerInvoice()">Verify Invoice</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeDealerVerificationModal() {
    const modal = document.getElementById('dealerVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyDealerInvoice() {
    const dealerName = document.getElementById('dealerName').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const vehicleModel = document.getElementById('vehicleModel').value;
    const invoiceAmount = document.getElementById('invoiceAmount').value;
    const invoiceDate = document.getElementById('invoiceDate').value;

    // Validation
    if (!dealerName || !invoiceNumber || !vehicleModel || !invoiceAmount || !invoiceDate) {
        showError('Please fill all dealer invoice details');
        return;
    }

    showLoading();

    // Simulate dealer verification
    setTimeout(() => {
        hideLoading();

        // Save dealer details
        formData.dealerDetails = {
            dealerName,
            invoiceNumber,
            vehicleModel,
            invoiceAmount,
            invoiceDate,
            verified: true
        };

        showSuccess('Dealer invoice verified successfully!');
        closeDealerVerificationModal();

        // Update dealer invoice upload to show verified status
        const dealerInvoiceBox = document.getElementById('dealerInvoice');
        if (dealerInvoiceBox) {
            const uploadBtn = dealerInvoiceBox.querySelector('.upload-btn');
            if (uploadBtn) {
                uploadBtn.textContent = '✓ Verified';
                uploadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                uploadBtn.style.color = 'white';
                uploadBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                uploadBtn.disabled = true;
            }
        }
    }, 2000);
}

// GST Verification Modal
function showGSTVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'gstVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeGSTVerificationModal()">&times;</span>
            <h3>GST Certificate Verification</h3>
            <form id="gstVerificationForm">
                <div class="bank-form-group">
                    <label for="gstNumber">GST Number</label>
                    <input type="text" id="gstNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="businessName">Business Name</label>
                    <input type="text" id="businessName" required>
                </div>
                <div class="bank-form-group">
                    <label for="businessAddress">Business Address</label>
                    <input type="text" id="businessAddress" required>
                </div>
                <div class="bank-form-group">
                    <label for="gstStatus">GST Status</label>
                    <select id="gstStatus" required>
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeGSTVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyGST()">Verify GST</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeGSTVerificationModal() {
    const modal = document.getElementById('gstVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyGST() {
    const gstNumber = document.getElementById('gstNumber').value;
    const businessName = document.getElementById('businessName').value;
    const businessAddress = document.getElementById('businessAddress').value;
    const gstStatus = document.getElementById('gstStatus').value;

    // Validation
    if (!gstNumber || !businessName || !businessAddress || !gstStatus) {
        showError('Please fill all GST details');
        return;
    }

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        showError('Please enter a valid GST number');
        return;
    }

    showLoading();

    // Simulate GST verification
    setTimeout(() => {
        hideLoading();

        // Save GST details
        formData.gstDetails = {
            gstNumber,
            businessName,
            businessAddress,
            gstStatus,
            verified: true
        };

        showSuccess('GST certificate verified successfully!');
        closeGSTVerificationModal();

        // Update GST upload to show verified status
        const gstBox = document.getElementById('gstDoc');
        if (gstBox) {
            const uploadBtn = gstBox.querySelector('.upload-btn');
            if (uploadBtn) {
                uploadBtn.textContent = '✓ Verified';
                uploadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                uploadBtn.style.color = 'white';
                uploadBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                uploadBtn.disabled = true;
            }
        }
    }, 2000);
}

// ITR Verification Modal
function showITRVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'itrVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeITRVerificationModal()">&times;</span>
            <h3>ITR Document Verification</h3>
            <form id="itrVerificationForm">
                <div class="bank-form-group">
                    <label for="assessmentYear">Assessment Year</label>
                    <input type="text" id="assessmentYear" placeholder="e.g., 2023-24" required>
                </div>
                <div class="bank-form-group">
                    <label for="totalIncome">Total Income</label>
                    <input type="number" id="totalIncome" required>
                </div>
                <div class="bank-form-group">
                    <label for="taxPaid">Tax Paid</label>
                    <input type="number" id="taxPaid" required>
                </div>
                <div class="bank-form-group">
                    <label for="acknowledgmentNumber">Acknowledgment Number</label>
                    <input type="text" id="acknowledgmentNumber" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeITRVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyITR()">Verify ITR</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeITRVerificationModal() {
    const modal = document.getElementById('itrVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyITR() {
    const assessmentYear = document.getElementById('assessmentYear').value;
    const totalIncome = document.getElementById('totalIncome').value;
    const taxPaid = document.getElementById('taxPaid').value;
    const acknowledgmentNumber = document.getElementById('acknowledgmentNumber').value;

    // Validation
    if (!assessmentYear || !totalIncome || !taxPaid || !acknowledgmentNumber) {
        showError('Please fill all ITR details');
        return;
    }

    showLoading();

    // Simulate ITR verification
    setTimeout(() => {
        hideLoading();

        // Save ITR details
        formData.itrDetails = {
            assessmentYear,
            totalIncome,
            taxPaid,
            acknowledgmentNumber,
            verified: true
        };

        showSuccess('ITR document verified successfully!');
        closeITRVerificationModal();

        // Update ITR upload to show verified status
        const itrBox = document.getElementById('itrDoc');
        if (itrBox) {
            const uploadBtn = itrBox.querySelector('.upload-btn');
            if (uploadBtn) {
                uploadBtn.textContent = '✓ Verified';
                uploadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                uploadBtn.style.color = 'white';
                uploadBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                uploadBtn.disabled = true;
            }
        }
    }, 2000);
}

// Updated function to show verification popup instead of direct upload
function handleDocumentUpload(documentId) {
    // Map document IDs to their types
    const documentTypeMap = {
        'bankStatement': 'bankStatement',
        'dealerInvoice': 'dealerInvoice', 
        'gstDoc': 'gstDoc',
        'itrDoc': 'itrDoc'
    };

    const documentType = documentTypeMap[documentId] || documentId;
    showDocumentVerificationPopup(documentType, documentId);
}

// OTP Verification Functions
let otpTimer;
let otpTimeRemaining = 120; // 2 minutes

function showOTPModal(mobileNumber) {
    const modal = document.getElementById('otpVerificationModal');
    const mobileDisplay = document.getElementById('otpMobileNumber');

    mobileDisplay.textContent = mobileNumber;
    modal.style.display = 'block';

    // Start OTP timer
    startOTPTimer();

    // Setup OTP boxes
    setupOTPBoxes();

    // Focus on first OTP box
    setTimeout(() => {
        const firstOtpBox = document.querySelector('.otp-box');
        if (firstOtpBox) firstOtpBox.focus();
    }, 100);
}

function closeOTPModal() {
    const modal = document.getElementById('otpVerificationModal');
    modal.style.display = 'none';

    // Clear timer
    if (otpTimer) {
        clearInterval(otpTimer);
    }

    // Reset values
    document.getElementById('otpInput').value = '';
    otpTimeRemaining = 120;
}

function startOTPTimer() {
    const timerDisplay = document.getElementById('otpTimer');
    const resendBtn = document.getElementById('resendOtpBtn');

    otpTimeRemaining = 120;
    resendBtn.disabled = true;
    resendBtn.textContent = 'Resend OTP';

    otpTimer = setInterval(() => {
        otpTimeRemaining--;

        const minutes = Math.floor(otpTimeRemaining / 60);
        const seconds = otpTimeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (otpTimeRemaining <= 0) {
            clearInterval(otpTimer);
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend OTP';
            timerDisplay.textContent = '00:00';
        }
    }, 1000);
}

function resendOTP() {
    const mobileNumber = document.getElementById('otpMobileNumber').textContent;

    showLoading();
    setTimeout(() => {
        hideLoading();
        showSuccess(`New OTP sent to ${mobileNumber}`);
        startOTPTimer();
    }, 1000);
}

function verifyOTP() {
    const otpBoxes = document.querySelectorAll('.otp-box');
    let otpValue = '';

    otpBoxes.forEach(box => {
        otpValue += box.value;
    });

    if (!otpValue || otpValue.length !== 6) {
        showError('Please enter complete 6-digit OTP');
        return;
    }

    // Validate OTP (accept 123456 or any 6-digit number for demo)
    if (!/^\d{6}$/.test(otpValue)) {
        showError('OTP must be 6 digits only');
        return;
    }

    showLoading();
    setTimeout(() => {
        hideLoading();

        // Find the verify button that was clicked
        const mobileNumber = document.getElementById('otpMobileNumber').textContent;
        const mobileInput = document.getElementById('mobile');

        if (mobileInput && mobileInput.value === mobileNumber) {
            const verifyBtn = document.getElementById('mobileVerifyBtn');
            const verificationStatus = document.getElementById('mobileVerificationStatus');

            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                verifyBtn.disabled = true;
            }

            if (verificationStatus) {
                verificationStatus.style.display = 'block';
            }

            // Show next form elements progressively
            showNextFormElements();
        }

        closeOTPModal();
        showSuccess('Mobile number verified successfully!');
    }, 1500);
}

function showNextFormElements() {
    // Show all form elements immediately after mobile verification
    document.getElementById('identityDocGroup').style.display = 'block';
    document.getElementById('idNumberGroup').style.display = 'block';
    document.getElementById('panNumberGroup').style.display = 'block';
    document.getElementById('emailGroup').style.display = 'block';
    document.getElementById('loanAmountGroup').style.display = 'block';
    document.getElementById('termsConditionsGroup').style.display = 'block';
}

function updateIdNumberLabel(documentType) {
    const idNumberLabel = document.getElementById('idNumberLabel');
    const idNumberInput = document.getElementById('idNumber');

    switch(documentType) {
        case 'aadhaar':
            idNumberLabel.textContent = 'Aadhaar Number';
            idNumberInput.placeholder = 'Enter 12-digit Aadhaar number';
            idNumberInput.maxLength = 12;
            break;
        case 'driving_license':
            idNumberLabel.textContent = 'Driving License Number';
            idNumberInput.placeholder = 'Enter driving license number';
            idNumberInput.maxLength = 20;
            break;
        case 'voter_id':
            idNumberLabel.textContent = 'Voter ID Number';
            idNumberInput.placeholder = 'Enter voter ID number';
            idNumberInput.maxLength = 20;
            break;
        case 'passport':
            idNumberLabel.textContent = 'Passport Number';
            idNumberInput.placeholder = 'Enter passport number';
            idNumberInput.maxLength = 20;
            break;
    }
}

function setupOTPBoxes() {
    const otpBoxes = document.querySelectorAll('.otp-box');

    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', function(e) {
            const value = e.target.value;

            // Only allow digits
            if (!/^\d$/.test(value)) {
                e.target.value = '';
                return;
            }

            // Add filled class
            if (value) {
                e.target.classList.add('filled');

                // Move to next box
                if (index < otpBoxes.length - 1) {
                    otpBoxes[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
        });

        box.addEventListener('keydown', function(e) {
            // Handle backspace
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpBoxes[index - 1].focus();
                otpBoxes[index - 1].value = '';
                otpBoxes[index - 1].classList.remove('filled');
            }
        });

        box.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData).getData('text');
            const digits = pastedData.replace(/\D/g, '').slice(0, 6);

            otpBoxes.forEach((otpBox, i) => {
                if (digits[i]) {
                    otpBox.value = digits[i];
                    otpBox.classList.add('filled');
                } else {
                    otpBox.value = '';
                    otpBox.classList.remove('filled');
                }
            });
        });
    });
}

// Export functions for global access
window.nextStep = nextStep;
window.prevStep = prevStep;
window.startApplication = startApplication;
window.showLoanSelection = showLoanSelection;
window.showDocumentUpload = showDocumentUpload;
window.showFinalApproval = showFinalApproval;
window.resetApplication = resetApplication;
window.simulateSteps = simulateSteps;
window.showThankYou = showThankYou;
window.restartApplication = restartApplication;
window.downloadSummary = downloadSummary;
window.acceptLoan = acceptLoan;
window.downloadLoanSummary = downloadLoanSummary;
window.hideNotification = hideNotification;

window.showDocumentPreview = showDocumentPreview;
window.closeDocumentPreview = closeDocumentPreview;
window.downloadDocument = downloadDocument;
window.openDocumentPreview = openDocumentPreview;
window.handleDocumentUpload = handleDocumentUpload;
window.showOTPModal = showOTPModal;
window.closeOTPModal = closeOTPModal;
window.resendOTP = resendOTP;
window.verifyOTP = verifyOTP;

// New functions for updated document verification
window.selectPDFFile = selectPDFFile;
window.selectITRMethod = selectITRMethod;
window.handleCarTypeSelection = handleCarTypeSelection;
window.handleFuelTypeSelection = handleFuelTypeSelection;
window.closeContactBranchModal = closeContactBranchModal;
window.contactBranch = contactBranch;
