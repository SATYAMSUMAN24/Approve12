# Overview

This is a comprehensive digital loan processing platform that provides a complete 4-step loan application system. The application guides users through loan selection, personal information collection, income verification, and loan offer presentation. Built as a single-page application using vanilla web technologies, it features real-time EMI calculations, document upload capabilities, mobile verification, and persistent form data storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Technology Stack**: Pure HTML5, CSS3, and vanilla JavaScript (ES6+)
- **Design Pattern**: Single Page Application (SPA) with step-based navigation system
- **State Management**: Global JavaScript object (`formData`) for maintaining application state across steps
- **UI Components**: Modular step-based interface with visual progress stepper, form validation, and dynamic content rendering
- **Responsive Design**: Mobile-first approach with flexible CSS Grid/Flexbox layouts

## Multi-Step Form System
- **Wizard Flow**: 4-step application process (Basic Details → Personal Details → Income Details → Loan Offer)
- **Progress Tracking**: Visual stepper component with step indicators and connector arrows
- **Data Persistence**: Local storage implementation to save user progress and prevent data loss
- **Conditional Logic**: Dynamic form sections that show/hide based on user selections (e.g., vehicle loan sub-types)

## Calculation Engine
- **Real-time EMI Calculator**: Automatic calculation based on loan amount, interest rate, and tenure
- **Interactive Controls**: Slider-based tenure selection with immediate visual feedback
- **Parameter Updates**: Dynamic recalculation when users modify any loan parameters
- **Default Configuration**: Pre-configured with sensible defaults (₹10 lakhs, 8.5% interest, 84 months)

## Document Management System
- **File Upload Interface**: Structured document upload with progress tracking
- **Document Categorization**: Support for different document types with validation
- **Upload State Management**: Global `uploadedDocuments` object to track document status
- **File Validation**: Client-side validation for file types and sizes

## User Experience Features
- **Mobile Verification**: Integrated mobile number verification with loading states
- **Selection Interface**: Toggle-based selection buttons for loan types and employment categories
- **Form Validation**: Real-time validation with visual feedback for user inputs
- **Auto-save Functionality**: Automatic saving of form data on input changes

# External Dependencies

## Core Technologies
- **Frontend Framework**: Vanilla JavaScript (no external frameworks)
- **Styling**: Custom CSS3 with modern layout techniques
- **Form Handling**: Native HTML5 form validation and custom JavaScript validation
- **Storage**: Browser localStorage for data persistence

## Integration Points
- **SMS Gateway**: Architecture prepared for mobile verification service integration
- **Document Storage**: Backend-ready file upload system for document management
- **Payment Processing**: Structure supports future payment gateway integration
- **Database**: Form data structure designed for easy backend database integration

## Browser APIs
- **File API**: For document upload functionality
- **LocalStorage API**: For client-side data persistence
- **DOM Events**: Comprehensive event handling for interactive elements#
