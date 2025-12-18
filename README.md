# E-Services for Gram Panchayat

A comprehensive web-based portal that digitizes Gram Panchayat services, enabling citizens to apply for certificates, track application status, and access various government schemes online. Staff and Officers can efficiently manage applications and services through role-based dashboards.

## 🎯 Project Overview

This project aims to improve the delivery of citizen services in villages by computerizing applications for gram panchayat services. The system allows users to submit applications for various services, track their progress, and enables admin and staff to manage applications for approval and creation of schemes.

## ✨ Features

### For Citizens (Users)
- **User Registration & Authentication** - Secure registration and login using Firebase Authentication
- **Service Search** - Search and browse available Gram Panchayat services
- **Service-Specific Forms** - Dynamic forms tailored to each service type (Birth Certificate, Income Certificate, etc.)
- **Application Submission** - Submit applications with detailed information
- **Application Tracking** - View status of submitted applications (Pending, Approved, Rejected)
- **Profile Management** - Update personal profile information

### For Staff
- **Application Management** - View all submitted applications
- **Status Updates** - Approve, reject, or mark applications as pending
- **Application Details** - View complete application information including form data

### For Officers/Admin
- **Service Management** - Create, update, and delete services
- **Application Oversight** - View and manage all applications across the system
- **Service Configuration** - Configure service-specific form fields
- **Status Management** - Update application statuses

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Authentication**: Firebase Authentication (Email/Password)
- **Data Storage**: Browser localStorage (for services and applications)
- **Logging**: Custom logging system with localStorage persistence
- **UI/UX**: Responsive design with mobile-first approach
- **Notifications**: Toast notification system

## 📖 Usage Guide

### For First-Time Users

1. **Register as a Citizen**
   - Click "Register" on the login page
   - Fill in your name, email, and password (minimum 6 characters)
   - Click "Register as User"
   - You'll receive a success notification

2. **Login**
   - Enter your email and password
   - Select role: "User / Citizen"
   - Click "Login"

3. **Apply for a Service**
   - Go to "Apply Service" tab
   - Select a service from the dropdown (e.g., "Birth Certificate")
   - Fill in the service-specific form fields that appear
   - Add any additional notes (optional)
   - Click "Submit Application"

4. **Track Application Status**
   - Go to "My Applications" tab
   - View all your submitted applications
   - Check the status (Pending, Approved, or Rejected)
   - View detailed application information

### For Staff

**Login Credentials:**
- Email: `staff@gp.local`
- Password: `staff123`
- Role: `Staff`

**Features:**
- View all applications
- Update application status (Approve/Reject/Pending)
- View complete application details

### For Officers/Admin

**Login Credentials:**
- Email: `officer@gp.local`
- Password: `officer123`
- Role: `Officer / Admin`

**Features:**
- **Manage Services**: Create, edit, and delete services
- **View All Applications**: See all applications in the system
- **Update Status**: Approve or reject applications
- **Service Configuration**: Each service can have custom form fields

## 📋 Available Services

The system includes 15 pre-configured services:

### Certificates
1. **Birth Certificate** - Child's name, DOB, place of birth, parents' names, address
2. **Death Certificate** - Deceased details, date/place/cause of death, applicant info
3. **Marriage Certificate** - Groom/bride details, marriage date/place, addresses
4. **Caste Certificate** - Applicant details, caste category, parents' names
5. **Income Certificate** - Income, occupation, purpose
6. **Domicile Certificate** - Residence proof, years of residence
7. **Family Certificate** - Head of family, member details
8. **Disability Certificate** - Disability type, percentage, medical certificate

### Employment
9. **Job Card (MGNREGA)** - Personal details, bank account, IFSC code

### Social Welfare
10. **Old Age Pension** - Age, income, bank details
11. **Widow Pension** - Husband's death details, income, bank details

### Complaints
12. **Street Light Repair** - Location, pole number, issue description
13. **Road Repair** - Location, issue type, detailed description
14. **Water Supply Issue** - Address, issue type, description
15. **Garbage Collection** - Location, issue type, description

## 🔍 Key Features Explained

### Dynamic Form Fields
Each service has its own set of form fields that appear automatically when selected:
- **Text inputs** - For names, addresses, etc.
- **Date pickers** - For dates of birth, death, marriage, etc.
- **Number inputs** - For age, income, percentages, etc.
- **Select dropdowns** - For categories, gender, issue types, etc.
- **Textareas** - For detailed descriptions and addresses

### Toast Notifications
- **Success** (green) - For successful operations
- **Error** (red) - For errors and failures
- **Warning** (yellow) - For warnings and validations
- **Info** (blue) - For informational messages

### Logging System
Every important action is logged:
- User registration and login
- Service creation, update, deletion
- Application submission and status updates
- View changes and navigation

Logs are stored in:
- Browser console (for debugging)
- localStorage (`gp_logs` key) for audit trail

## 🧪 Testing

### Manual Test Cases

1. **User Registration**
   - Register with valid email and password
   - Try registering with duplicate email (should fail)
   - Try registering with password < 6 characters (should fail)

2. **User Login**
   - Login with correct credentials
   - Try incorrect password (should fail)
   - Try incorrect email (should fail)

3. **Service Application**
   - Select a service
   - Verify form fields appear
   - Fill required fields and submit
   - Try submitting without required fields (should fail)

4. **Status Updates**
   - Login as Staff/Officer
   - View applications
   - Update status (Approve/Reject/Pending)
   - Verify status updates in User view

5. **Service Management (Officer)**
   - Create a new service
   - Edit existing service
   - Delete a service
   - Verify changes reflect in User dropdown
