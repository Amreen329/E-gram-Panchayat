import { appLogger } from "./logger.js";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "./firebase.js";

const STORAGE_KEYS = {
  SERVICES: "gp_services",
  APPLICATIONS: "gp_applications",
};

function loadArray(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    appLogger.error("Failed to parse localStorage", { key, err });
    return [];
  }
}

function saveArray(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

// --- Users (Firebase Auth only, metadata in Auth/displayName) ---
export async function registerUser({ name, email, password }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    appLogger.info("User registered", { email });

    return {
      id: cred.user.uid,
      name,
      email,
      role: "user",
    };
  } catch (err) {
    appLogger.error("Firebase register failed", { email, error: err.message });
    throw new Error(err.message || "Registration failed");
  }
}

export async function login({ email, password, role }) {
  if (role === "user") {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = {
        id: cred.user.uid,
        name: cred.user.displayName || email,
        email: cred.user.email,
        role: "user",
      };

      appLogger.info("User login success", { email });
      return user;
    } catch (err) {
      appLogger.warn("User login failed", { email, error: err.message });
      throw new Error("Invalid user credentials");
    }
  }

  // Simplified demo: staff/officer still hard-coded
  if (role === "staff") {
    if (email === "staff@gp.local" && password === "staff123") {
      const staff = { id: "staff-1", name: "Staff Member", email, role: "staff" };
      appLogger.info("Staff login success", { email });
      return staff;
    }
  }

  if (role === "officer") {
    if (email === "officer@gp.local" && password === "officer123") {
      const officer = { id: "officer-1", name: "Officer", email, role: "officer" };
      appLogger.info("Officer login success", { email });
      return officer;
    }
  }

  appLogger.warn("Login failed", { email, role });
  throw new Error("Invalid credentials");
}

// --- Services (localStorage) ---
export async function getServices() {
  let services = loadArray(STORAGE_KEYS.SERVICES);
  
  // Default services with formFields
  const defaults = [
      {
        id: "svc-1",
        name: "Birth Certificate",
        category: "Certificates",
        description: "Issue of birth certificate for village residents. Required documents: Hospital discharge summary or affidavit.",
        formFields: [
          { name: "childName", label: "Child's Full Name", type: "text", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
          { name: "placeOfBirth", label: "Place of Birth", type: "text", required: true },
          { name: "fatherName", label: "Father's Name", type: "text", required: true },
          { name: "motherName", label: "Mother's Name", type: "text", required: true },
          { name: "address", label: "Permanent Address", type: "textarea", required: true },
          { name: "aadhaarNumber", label: "Aadhaar Number (if available)", type: "text", required: false },
        ],
      },
      {
        id: "svc-2",
        name: "Death Certificate",
        category: "Certificates",
        description: "Issue of death certificate for deceased village residents. Required documents: Medical certificate or hospital records.",
        formFields: [
          { name: "deceasedName", label: "Deceased Person's Full Name", type: "text", required: true },
          { name: "dateOfDeath", label: "Date of Death", type: "date", required: true },
          { name: "placeOfDeath", label: "Place of Death", type: "text", required: true },
          { name: "causeOfDeath", label: "Cause of Death", type: "text", required: true },
          { name: "applicantName", label: "Applicant's Name (Relation)", type: "text", required: true },
          { name: "applicantRelation", label: "Relation to Deceased", type: "text", required: true },
          { name: "address", label: "Address", type: "textarea", required: true },
        ],
      },
      {
        id: "svc-3",
        name: "Marriage Certificate",
        category: "Certificates",
        description: "Registration and issue of marriage certificate for couples married in the village. Required documents: Marriage invitation, photos, identity proof.",
        formFields: [
          { name: "groomName", label: "Groom's Full Name", type: "text", required: true },
          { name: "brideName", label: "Bride's Full Name", type: "text", required: true },
          { name: "dateOfMarriage", label: "Date of Marriage", type: "date", required: true },
          { name: "placeOfMarriage", label: "Place of Marriage", type: "text", required: true },
          { name: "groomAge", label: "Groom's Age", type: "number", required: true },
          { name: "brideAge", label: "Bride's Age", type: "number", required: true },
          { name: "groomAddress", label: "Groom's Address", type: "textarea", required: true },
          { name: "brideAddress", label: "Bride's Address", type: "textarea", required: true },
        ],
      },
      {
        id: "svc-4",
        name: "Caste Certificate",
        category: "Certificates",
        description: "Issue of caste certificate for SC/ST/OBC category residents. Required documents: School certificate, parent's caste certificate, affidavit.",
        formFields: [
          { name: "applicantName", label: "Applicant's Full Name", type: "text", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
          { name: "casteCategory", label: "Caste Category", type: "select", options: ["SC", "ST", "OBC", "General"], required: true },
          { name: "casteName", label: "Caste Name", type: "text", required: true },
          { name: "fatherName", label: "Father's Name", type: "text", required: true },
          { name: "motherName", label: "Mother's Name", type: "text", required: true },
          { name: "address", label: "Permanent Address", type: "textarea", required: true },
          { name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
        ],
      },
      {
        id: "svc-5",
        name: "Income Certificate",
        category: "Certificates",
        description: "Issue of income certificate for various government schemes and benefits. Required documents: Salary slips, land records, affidavit.",
        formFields: [
          { name: "applicantName", label: "Applicant's Full Name", type: "text", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
          { name: "annualIncome", label: "Annual Income (in ₹)", type: "number", required: true },
          { name: "occupation", label: "Occupation", type: "text", required: true },
          { name: "fatherName", label: "Father's Name", type: "text", required: true },
          { name: "address", label: "Permanent Address", type: "textarea", required: true },
          { name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
          { name: "purpose", label: "Purpose of Certificate", type: "textarea", required: true },
        ],
      },
      {
        id: "svc-6",
        name: "Domicile Certificate",
        category: "Certificates",
        description: "Issue of domicile/residence certificate proving permanent residence in the village. Required documents: Aadhaar card, ration card, land records.",
        formFields: [
          { name: "applicantName", label: "Applicant's Full Name", type: "text", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
          { name: "fatherName", label: "Father's Name", type: "text", required: true },
          { name: "motherName", label: "Mother's Name", type: "text", required: true },
          { name: "address", label: "Permanent Address", type: "textarea", required: true },
          { name: "yearsOfResidence", label: "Years of Residence in Village", type: "number", required: true },
          { name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
        ],
      },
      {
        id: "svc-7",
        name: "Family Certificate",
        category: "Certificates",
        description: "Issue of family certificate listing all family members. Required documents: Ration card, Aadhaar cards of all members, family photo.",
        formFields: [
          { name: "headOfFamily", label: "Head of Family Name", type: "text", required: true },
          { name: "address", label: "Family Address", type: "textarea", required: true },
          { name: "familyMembers", label: "Number of Family Members", type: "number", required: true },
          { name: "memberDetails", label: "Family Members Details (Name, Age, Relation)", type: "textarea", required: true, placeholder: "e.g., John Doe, 45, Self; Jane Doe, 40, Spouse; etc." },
          { name: "aadhaarNumber", label: "Head's Aadhaar Number", type: "text", required: true },
        ],
      },
      {
        id: "svc-8",
        name: "Job Card (MGNREGA)",
        category: "Employment",
        description: "Registration for Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA) job card. Required documents: Aadhaar card, bank account details, photos.",
        formFields: [
          { name: "applicantName", label: "Applicant's Full Name", type: "text", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
          { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"], required: true },
          { name: "fatherName", label: "Father's/Husband's Name", type: "text", required: true },
          { name: "address", label: "Permanent Address", type: "textarea", required: true },
          { name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
          { name: "bankAccountNumber", label: "Bank Account Number", type: "text", required: true },
          { name: "ifscCode", label: "IFSC Code", type: "text", required: true },
        ],
      },
      {
        id: "svc-9",
        name: "Old Age Pension",
        category: "Social Welfare",
        description: "Application for old age pension scheme for senior citizens above 60 years. Required documents: Age proof, income certificate, bank account details.",
        formFields: [
          { name: "applicantName", label: "Applicant's Full Name", type: "text", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
          { name: "age", label: "Age", type: "number", required: true },
          { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"], required: true },
          { name: "address", label: "Permanent Address", type: "textarea", required: true },
          { name: "annualIncome", label: "Annual Income (in ₹)", type: "number", required: true },
          { name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
          { name: "bankAccountNumber", label: "Bank Account Number", type: "text", required: true },
          { name: "ifscCode", label: "IFSC Code", type: "text", required: true },
        ],
      },
      {
        id: "svc-10",
        name: "Widow Pension",
        category: "Social Welfare",
        description: "Application for widow pension scheme. Required documents: Death certificate of spouse, income certificate, bank account details.",
        formFields: [
          { name: "applicantName", label: "Applicant's Full Name", type: "text", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
          { name: "husbandName", label: "Deceased Husband's Name", type: "text", required: true },
          { name: "dateOfDeath", label: "Date of Husband's Death", type: "date", required: true },
          { name: "address", label: "Permanent Address", type: "textarea", required: true },
          { name: "annualIncome", label: "Annual Income (in ₹)", type: "number", required: true },
          { name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
          { name: "bankAccountNumber", label: "Bank Account Number", type: "text", required: true },
          { name: "ifscCode", label: "IFSC Code", type: "text", required: true },
        ],
      },
      {
        id: "svc-11",
        name: "Disability Certificate",
        category: "Certificates",
        description: "Issue of disability certificate for persons with disabilities. Required documents: Medical certificate from authorized doctor, photos, identity proof.",
        formFields: [
          { name: "applicantName", label: "Applicant's Full Name", type: "text", required: true },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
          { name: "disabilityType", label: "Type of Disability", type: "select", options: ["Physical", "Visual", "Hearing", "Mental", "Multiple"], required: true },
          { name: "disabilityPercentage", label: "Disability Percentage", type: "number", required: true, min: 1, max: 100 },
          { name: "fatherName", label: "Father's Name", type: "text", required: true },
          { name: "address", label: "Permanent Address", type: "textarea", required: true },
          { name: "aadhaarNumber", label: "Aadhaar Number", type: "text", required: true },
          { name: "medicalCertificateDate", label: "Medical Certificate Date", type: "date", required: true },
        ],
      },
      {
        id: "svc-12",
        name: "Street Light Repair",
        category: "Complaints",
        description: "Request repair for non-functional street lights in the village. Please provide location details and pole number if available.",
        formFields: [
          { name: "applicantName", label: "Applicant's Name", type: "text", required: true },
          { name: "contactNumber", label: "Contact Number", type: "tel", required: true },
          { name: "location", label: "Location/Address of Street Light", type: "textarea", required: true },
          { name: "poleNumber", label: "Pole Number (if known)", type: "text", required: false },
          { name: "issueDescription", label: "Issue Description", type: "textarea", required: true, placeholder: "Describe the problem (e.g., light not working, flickering, etc.)" },
        ],
      },
      {
        id: "svc-13",
        name: "Road Repair",
        category: "Complaints",
        description: "Request for repair of damaged roads, potholes, or drainage issues in the village. Please provide exact location and description.",
        formFields: [
          { name: "applicantName", label: "Applicant's Name", type: "text", required: true },
          { name: "contactNumber", label: "Contact Number", type: "tel", required: true },
          { name: "location", label: "Road Location/Address", type: "textarea", required: true },
          { name: "issueType", label: "Issue Type", type: "select", options: ["Pothole", "Road Damage", "Drainage Issue", "Other"], required: true },
          { name: "issueDescription", label: "Detailed Description", type: "textarea", required: true, placeholder: "Describe the road condition and issues" },
        ],
      },
      {
        id: "svc-14",
        name: "Water Supply Issue",
        category: "Complaints",
        description: "Report water supply problems, pipe leaks, or water quality issues. Please provide location and contact details.",
        formFields: [
          { name: "applicantName", label: "Applicant's Name", type: "text", required: true },
          { name: "contactNumber", label: "Contact Number", type: "tel", required: true },
          { name: "address", label: "Address", type: "textarea", required: true },
          { name: "issueType", label: "Issue Type", type: "select", options: ["No Water Supply", "Low Pressure", "Pipe Leak", "Water Quality Issue", "Other"], required: true },
          { name: "issueDescription", label: "Detailed Description", type: "textarea", required: true },
        ],
      },
      {
        id: "svc-15",
        name: "Garbage Collection",
        category: "Complaints",
        description: "Request for garbage collection or report illegal dumping sites. Please provide location details.",
        formFields: [
          { name: "applicantName", label: "Applicant's Name", type: "text", required: true },
          { name: "contactNumber", label: "Contact Number", type: "tel", required: true },
          { name: "location", label: "Location/Address", type: "textarea", required: true },
          { name: "issueType", label: "Issue Type", type: "select", options: ["Garbage Not Collected", "Illegal Dumping", "Overflowing Dustbin", "Other"], required: true },
          { name: "issueDescription", label: "Detailed Description", type: "textarea", required: true },
        ],
      },
    ];
    
  if (!services.length) {
    saveArray(STORAGE_KEYS.SERVICES, defaults);
    return defaults;
  }
  
  // Migrate existing services: add formFields if missing
  const defaultServiceMap = {};
  defaults.forEach(svc => {
    defaultServiceMap[svc.id] = svc;
    // Also match by name for services created before formFields were added
    defaultServiceMap[svc.name.toLowerCase()] = svc;
  });
  
  let needsUpdate = false;
  services = services.map(service => {
    // If service already has formFields, keep it
    if (service.formFields && service.formFields.length > 0) {
      return service;
    }
    
    // Try to find matching default service by ID or name
    const match = defaultServiceMap[service.id] || defaultServiceMap[service.name.toLowerCase()];
    if (match && match.formFields) {
      needsUpdate = true;
      return { ...service, formFields: match.formFields };
    }
    
    // If no match found, return service as-is (officer-created services without formFields)
    return service;
  });
  
  if (needsUpdate) {
    saveArray(STORAGE_KEYS.SERVICES, services);
  }
  
  return services;
}

export async function upsertService(service) {
  const services = await getServices();
  if (service.id) {
    const idx = services.findIndex((s) => s.id === service.id);
    if (idx !== -1) {
      services[idx] = { ...services[idx], ...service };
    }
  } else {
    service.id = `svc-${Date.now()}`;
    services.push(service);
  }
  saveArray(STORAGE_KEYS.SERVICES, services);
  appLogger.info("Service upserted", { id: service.id });
  return service;
}

export async function deleteService(id) {
  let services = await getServices();
  services = services.filter((s) => s.id !== id);
  saveArray(STORAGE_KEYS.SERVICES, services);
  appLogger.info("Service deleted", { id });
}

// --- Applications (localStorage) ---
export async function createApplication({ userId, serviceId, details, formData = {} }) {
  const applications = loadArray(STORAGE_KEYS.APPLICATIONS);
  const app = {
    id: `app-${Date.now()}`,
    userId,
    serviceId,
    details,
    formData, // Store the form field data
    status: "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  applications.push(app);
  saveArray(STORAGE_KEYS.APPLICATIONS, applications);
  appLogger.info("Application created", { appId: app.id, serviceId });
  return app;
}

export async function getApplicationsForUser(userId) {
  const applications = loadArray(STORAGE_KEYS.APPLICATIONS);
  return applications.filter((a) => a.userId === userId);
}

export async function getAllApplications() {
  return loadArray(STORAGE_KEYS.APPLICATIONS);
}

export async function updateApplicationStatus(appId, status) {
  const apps = loadArray(STORAGE_KEYS.APPLICATIONS);
  const idx = apps.findIndex((a) => a.id === appId);
  if (idx === -1) throw new Error("Application not found");
  apps[idx].status = status;
  apps[idx].updatedAt = new Date().toISOString();
  saveArray(STORAGE_KEYS.APPLICATIONS, apps);
  appLogger.info("Application status updated", { appId, status });
}