import { appLogger } from "./logger.js";
import Toast from "./toast.js";
import {
  registerUser,
  login,
  getServices,
  upsertService,
  deleteService,
  createApplication,
  getApplicationsForUser,
  getAllApplications,
  updateApplicationStatus,
} from "./state.js";

let currentUser = null;
let searchDebounceTimer = null;

// UTILITIES

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function showLoading(show = true) {
  const overlay = $("#loading-overlay");
  if (overlay) {
    overlay.setAttribute("aria-hidden", !show);
  }
}

function switchView(viewId) {
  // Prevent showing login/register once logged in
  if (currentUser && viewId === "login-view") return;
  $all(".gp-view").forEach((v) => v.classList.remove("gp-view--active"));
  const view = document.getElementById(viewId);
  if (view) view.classList.add("gp-view--active");
  
  // Close mobile menu if open
  const mobileNav = $("#mobile-nav");
  const mobileToggle = $("#mobile-menu-toggle");
  if (mobileNav && mobileNav.classList.contains("gp-nav__mobile--open")) {
    mobileNav.classList.remove("gp-nav__mobile--open");
    if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
  }
  
  appLogger.debug("Switched view", { viewId });
}

function switchTab(groupName, tabId) {
  const tabsContainer = document.querySelector(`.gp-tabs[data-tabs="${groupName}"]`);
  if (!tabsContainer) return;

  $all(`[data-tabs="${groupName}"] .gp-tab`).forEach((btn) =>
    btn.classList.toggle("gp-tab--active", btn.dataset.tab === tabId)
  );
  $all(`#${groupName}-view .gp-tab-panel`).forEach((panel) =>
    panel.classList.toggle("gp-tab-panel--active", panel.id === tabId)
  );

  appLogger.debug("Switched tab", { groupName, tabId });
}

// RENDER FUNCTIONS

async function renderServicesForUser(filter = "") {
  const container = $("#user-services-list");
  const services = await getServices();
  const lower = filter.toLowerCase();

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.category.toLowerCase().includes(lower) ||
      s.description.toLowerCase().includes(lower)
  );

  if (!filtered.length) {
    container.innerHTML = `<p class="gp-muted">No services found.</p>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (s) => `
      <article class="gp-card">
        <div class="gp-card__title">${s.name}</div>
        <div class="gp-card__meta">
          <span class="gp-pill">${s.category}</span>
        </div>
        <p>${s.description}</p>
      </article>
    `
    )
    .join("");
}

let serviceSelectListenerAdded = false;

async function populateApplyServiceSelect() {
  const select = $("#apply-service-id");
  if (!select) return;
  
  const services = await getServices();
  select.innerHTML =
    `<option value="">-- Select a service --</option>` +
    services.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  
  // Add event listener only once
  if (!serviceSelectListenerAdded) {
    select.addEventListener("change", async (e) => {
      const serviceId = e.target.value;
      await renderServiceFormFields(serviceId);
    });
    serviceSelectListenerAdded = true;
  }
}

async function renderServiceFormFields(serviceId) {
  const container = $("#service-form-fields");
  if (!container) {
    console.warn("Service form fields container not found");
    return;
  }
  
  if (!serviceId) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }
  
  container.style.display = "block";
  const services = await getServices();
  const service = services.find((s) => s.id === serviceId);
  
  if (!service) {
    container.innerHTML = `<p class="gp-muted">Service not found.</p>`;
    return;
  }
  
  console.log("Rendering form for service:", service.name, "FormFields:", service.formFields);
  
  if (!service.formFields || service.formFields.length === 0) {
    container.innerHTML = `
      <div class="gp-form-section">
        <p class="gp-form-section__desc">This service doesn't require additional form fields. Please use the "Additional Notes" field below to provide details.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="gp-form-section">
      <h4 class="gp-form-section__title">${service.name} - Application Details</h4>
      <p class="gp-form-section__desc">Please fill in all required details for ${service.name}</p>
    </div>
  `;
  
  service.formFields.forEach((field) => {
    const fieldId = `field-${serviceId}-${field.name}`;
    let fieldHTML = "";
    
    if (field.type === "textarea") {
      fieldHTML = `
        <label>
          ${field.label}${field.required ? " *" : ""}
          <textarea 
            id="${fieldId}" 
            name="${field.name}" 
            rows="3"
            ${field.required ? "required" : ""}
            ${field.placeholder ? `placeholder="${field.placeholder}"` : ""}
          ></textarea>
        </label>
      `;
    } else if (field.type === "select") {
      const options = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      fieldHTML = `
        <label>
          ${field.label}${field.required ? " *" : ""}
          <select 
            id="${fieldId}" 
            name="${field.name}" 
            ${field.required ? "required" : ""}
          >
            <option value="">-- Select ${field.label.toLowerCase()} --</option>
            ${options}
          </select>
        </label>
      `;
    } else {
      const inputType = field.type === "tel" ? "tel" : field.type === "number" ? "number" : field.type;
      const attrs = [];
      if (field.required) attrs.push("required");
      if (field.min !== undefined) attrs.push(`min="${field.min}"`);
      if (field.max !== undefined) attrs.push(`max="${field.max}"`);
      if (field.placeholder) attrs.push(`placeholder="${field.placeholder}"`);
      
      fieldHTML = `
        <label>
          ${field.label}${field.required ? " *" : ""}
          <input 
            type="${inputType}" 
            id="${fieldId}" 
            name="${field.name}" 
            ${attrs.join(" ")}
          />
        </label>
      `;
    }
    
    container.insertAdjacentHTML("beforeend", fieldHTML);
  });
}

async function renderUserApplications() {
  const container = $("#user-applications-list");
  if (!currentUser) return;
  const apps = await getApplicationsForUser(currentUser.id);
  const services = await getServices();

  if (!apps.length) {
    container.innerHTML = `<p class="gp-muted">You have not applied for any services yet.</p>`;
    return;
  }

  container.innerHTML = apps
    .map((a) => {
      const service = services.find((s) => s.id === a.serviceId);
      const statusClass =
        a.status === "Approved"
          ? "gp-pill--status-success"
          : a.status === "Rejected"
          ? "gp-pill--status-rejected"
          : "gp-pill--status";
      
      // Render form data if available
      let formDataHTML = "";
      if (a.formData && Object.keys(a.formData).length > 0) {
        formDataHTML = `
          <div class="gp-application-details">
            <strong>Application Details:</strong>
            <ul class="gp-details-list">
              ${Object.entries(a.formData).map(([key, value]) => {
                if (!value) return "";
                const field = service?.formFields?.find(f => f.name === key);
                const label = field?.label || key;
                return `<li><strong>${label}:</strong> ${value}</li>`;
              }).filter(Boolean).join("")}
            </ul>
          </div>
        `;
      }
      
      return `
      <article class="gp-card">
        <div class="gp-card__title">${service ? service.name : "Unknown Service"}</div>
        <div class="gp-card__meta">
          <span class="gp-pill ${statusClass}">${a.status}</span>
          <span class="gp-pill">ID: ${a.id}</span>
        </div>
        ${formDataHTML}
        ${a.details ? `<p><strong>Additional Notes:</strong> ${a.details}</p>` : ""}
        <small>Applied: ${new Date(a.createdAt).toLocaleString()}</small>
      </article>
    `;
    })
    .join("");
}

async function renderOfficerServices() {
  const container = $("#officer-services-list");
  const services = await getServices();

  if (!services.length) {
    container.innerHTML = `<p class="gp-muted">No services configured yet.</p>`;
    return;
  }

  container.innerHTML = services
    .map(
      (s) => `
      <article class="gp-card">
        <div class="gp-card__title">${s.name}</div>
        <div class="gp-card__meta">
          <span class="gp-pill">${s.category}</span>
          <button class="gp-btn gp-btn--secondary gp-btn--sm" data-edit-service="${s.id}">
            Edit
          </button>
          <button class="gp-btn gp-btn--ghost gp-btn--sm" data-delete-service="${s.id}">
            Delete
          </button>
        </div>
        <p>${s.description}</p>
      </article>
    `
    )
    .join("");
}

async function renderAllApplicationsForOfficer() {
  const container = $("#officer-applications-list");
  const apps = await getAllApplications();
  const services = await getServices();

  if (!apps.length) {
    container.innerHTML = `<p class="gp-muted">No applications submitted yet.</p>`;
    return;
  }

  container.innerHTML = apps
    .map((a) => {
      const service = services.find((s) => s.id === a.serviceId);
      const statusClass =
        a.status === "Approved"
          ? "gp-pill--status-success"
          : a.status === "Rejected"
          ? "gp-pill--status-rejected"
          : "gp-pill--status";

      // Render form data if available
      let formDataHTML = "";
      if (a.formData && Object.keys(a.formData).length > 0) {
        formDataHTML = `
          <div class="gp-application-details">
            <strong>Application Details:</strong>
            <ul class="gp-details-list">
              ${Object.entries(a.formData).map(([key, value]) => {
                if (!value) return "";
                const field = service?.formFields?.find(f => f.name === key);
                const label = field?.label || key;
                return `<li><strong>${label}:</strong> ${value}</li>`;
              }).filter(Boolean).join("")}
            </ul>
          </div>
        `;
      }
      
      return `
      <article class="gp-card">
        <div class="gp-card__title">${service ? service.name : "Unknown Service"}</div>
        <div class="gp-card__meta">
          <span class="gp-pill ${statusClass}">${a.status}</span>
          <span class="gp-pill">App: ${a.id}</span>
          <span class="gp-pill">User: ${a.userId}</span>
        </div>
        ${formDataHTML}
        ${a.details ? `<p><strong>Additional Notes:</strong> ${a.details}</p>` : ""}
        <small>Updated: ${new Date(a.updatedAt).toLocaleString()}</small>
        <div style="margin-top: 6px; display:flex; gap:6px; flex-wrap:wrap;">
          <button class="gp-btn gp-btn--secondary gp-btn--sm" data-status="Approved" data-app="${a.id}">
            Approve
          </button>
          <button class="gp-btn gp-btn--secondary gp-btn--sm" data-status="Rejected" data-app="${a.id}">
            Reject
          </button>
          <button class="gp-btn gp-btn--ghost gp-btn--sm" data-status="Pending" data-app="${a.id}">
            Mark Pending
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}

async function renderStaffApplications() {
  const container = $("#staff-applications-list");
  const apps = await getAllApplications();
  const services = await getServices();

  if (!apps.length) {
    container.innerHTML = `<p class="gp-muted">No applications submitted yet.</p>`;
    return;
  }

  container.innerHTML = apps
    .map((a) => {
      const service = services.find((s) => s.id === a.serviceId);
      const statusClass =
        a.status === "Approved"
          ? "gp-pill--status-success"
          : a.status === "Rejected"
          ? "gp-pill--status-rejected"
          : "gp-pill--status";

      // Render form data if available
      let formDataHTML = "";
      if (a.formData && Object.keys(a.formData).length > 0) {
        formDataHTML = `
          <div class="gp-application-details">
            <strong>Application Details:</strong>
            <ul class="gp-details-list">
              ${Object.entries(a.formData).map(([key, value]) => {
                if (!value) return "";
                const field = service?.formFields?.find(f => f.name === key);
                const label = field?.label || key;
                return `<li><strong>${label}:</strong> ${value}</li>`;
              }).filter(Boolean).join("")}
            </ul>
          </div>
        `;
      }
      
      return `
      <article class="gp-card">
        <div class="gp-card__title">${service ? service.name : "Unknown Service"}</div>
        <div class="gp-card__meta">
          <span class="gp-pill ${statusClass}">${a.status}</span>
          <span class="gp-pill">App: ${a.id}</span>
        </div>
        ${formDataHTML}
        ${a.details ? `<p><strong>Additional Notes:</strong> ${a.details}</p>` : ""}
        <div style="margin-top: 6px; display:flex; gap:6px; flex-wrap:wrap;">
          <button class="gp-btn gp-btn--secondary gp-btn--sm" data-status="Approved" data-app="${a.id}">
            Approve
          </button>
          <button class="gp-btn gp-btn--secondary gp-btn--sm" data-status="Rejected" data-app="${a.id}">
            Reject
          </button>
          <button class="gp-btn gp-btn--ghost gp-btn--sm" data-status="Pending" data-app="${a.id}">
            Mark Pending
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}

// EVENT HANDLERS

async function handleLogin(e) {
  e.preventDefault();
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  const role = $("#login-role").value;

  if (!email || !password || !role) {
    Toast.error("Please fill all fields");
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add("gp-btn--loading");
  showLoading(true);

  try {
    const user = await login({ email, password, role });
    currentUser = user;

    if (role === "user") {
      $("#user-welcome").textContent = `Hello, ${user.name}`;
      $("#profile-name").value = user.name;
      $("#profile-email").value = user.email;
      await renderServicesForUser();
      await populateApplyServiceSelect();
      await renderUserApplications();
      switchView("user-view");
    } else if (role === "staff") {
      $("#staff-welcome").textContent = `Staff: ${user.email}`;
      await renderStaffApplications();
      switchView("staff-view");
    } else if (role === "officer") {
      $("#officer-welcome").textContent = `Officer: ${user.email}`;
      await renderOfficerServices();
      await renderAllApplicationsForOfficer();
      switchView("officer-view");
    }

    // Update navigation buttons
    updateNavButtons(user);
    
    Toast.success(`Welcome back, ${user.name || user.email}!`);
    e.target.reset();
  } catch (err) {
    Toast.error(err.message || "Login failed. Please check your credentials.");
    appLogger.error("Login failed", { email, role, error: err.message });
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("gp-btn--loading");
    submitBtn.textContent = originalText;
    showLoading(false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = $("#reg-name").value.trim();
  const email = $("#reg-email").value.trim();
  const password = $("#reg-password").value;

  if (!name || !email || !password) {
    Toast.error("Please fill all fields");
    return;
  }

  if (password.length < 6) {
    Toast.error("Password must be at least 6 characters");
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.classList.add("gp-btn--loading");
  showLoading(true);

  try {
    const user = await registerUser({ name, email, password });
    Toast.success("Registration successful! You can now login as User.");
    appLogger.info("Registration success", { email: user.email });
    e.target.reset();
  } catch (err) {
    const errorMsg = err.message.includes("email-already-in-use") 
      ? "This email is already registered. Please login instead."
      : err.message || "Registration failed. Please try again.";
    Toast.error(errorMsg);
    appLogger.error("Registration failed", { email, error: err.message });
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("gp-btn--loading");
    submitBtn.textContent = originalText;
    showLoading(false);
  }
}

async function handleUserApply(e) {
  e.preventDefault();
  if (!currentUser) {
    Toast.error("Please login to apply for services");
    return;
  }

  const serviceId = $("#apply-service-id").value;
  const additionalNotes = $("#apply-details").value.trim();

  if (!serviceId) {
    Toast.warning("Please select a service");
    return;
  }

  // Collect form field data
  const services = await getServices();
  const service = services.find((s) => s.id === serviceId);
  const formData = {};
  
  if (service && service.formFields) {
    let hasErrors = false;
    service.formFields.forEach((field) => {
      const fieldId = `field-${serviceId}-${field.name}`;
      const fieldElement = document.getElementById(fieldId);
      if (fieldElement) {
        const value = fieldElement.value.trim();
        if (field.required && !value) {
          Toast.error(`Please fill ${field.label}`);
          fieldElement.focus();
          hasErrors = true;
          return;
        }
        formData[field.name] = value;
      }
    });
    
    if (hasErrors) return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.classList.add("gp-btn--loading");

  try {
    await createApplication({ 
      userId: currentUser.id, 
      serviceId, 
      details: additionalNotes,
      formData: formData
    });
    Toast.success("Application submitted successfully!");
    
    // Reset form
    e.target.reset();
    $("#service-form-fields").innerHTML = "";
    
    await renderUserApplications();
    // Switch to status tab to show the new application
    switchTab("user", "user-status");
  } catch (err) {
    Toast.error("Failed to submit application. Please try again.");
    appLogger.error("Application submission failed", { error: err.message });
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("gp-btn--loading");
  }
}

function handleUserProfileUpdate(e) {
  e.preventDefault();
  if (!currentUser) {
    Toast.error("Please login to update profile");
    return;
  }
  const newName = $("#profile-name").value.trim();
  if (!newName) {
    Toast.warning("Name cannot be empty");
    return;
  }
  currentUser.name = newName;
  $("#user-welcome").textContent = `Hello, ${newName}`;
  appLogger.info("Profile updated", { userId: currentUser.id });
  Toast.info("Profile updated successfully");
}

function updateNavButtons(user) {
  const loginNavBtn = $("#nav-login-btn");
  const mobileLoginBtn = $("#mobile-login-btn");
  const logoutNavBtn = $("#nav-logout-btn");
  const mobileLogoutBtn = $("#mobile-logout-btn");
  const navUserName = $("#nav-user-name");
  
  if (user) {
    // User is logged in - show logout, hide login
    if (loginNavBtn) loginNavBtn.style.display = "none";
    if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
    if (logoutNavBtn) {
      logoutNavBtn.style.display = "inline-flex";
      if (navUserName) {
        const displayName = user.name || user.email || "User";
        navUserName.textContent = displayName;
      }
    }
    if (mobileLogoutBtn) {
      mobileLogoutBtn.style.display = "block";
      mobileLogoutBtn.textContent = `Logout (${user.name || user.email || "User"})`;
    }
  } else {
    // User is logged out - show login, hide logout
    if (loginNavBtn) loginNavBtn.style.display = "inline-flex";
    if (mobileLoginBtn) mobileLoginBtn.style.display = "block";
    if (logoutNavBtn) logoutNavBtn.style.display = "none";
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = "none";
  }
}

function handleLogout() {
  appLogger.info("User logged out", { userId: currentUser?.id, role: currentUser?.role });
  const userName = currentUser?.name || currentUser?.email || "User";
  currentUser = null;
  
  // Update navigation buttons
  updateNavButtons(null);
  
  switchView("login-view");
  Toast.info(`Logged out successfully. Goodbye, ${userName}!`);
}

// Officer: service form
function bindOfficerServiceForm() {
  $("#officer-service-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("#service-id").value || undefined;
    const name = $("#service-name").value.trim();
    const category = $("#service-category").value.trim();
    const description = $("#service-description").value.trim();

    if (!name || !category || !description) {
      Toast.warning("Please fill all fields");
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.classList.add("gp-btn--loading");

    try {
      await upsertService({ id, name, category, description });
      Toast.success(id ? "Service updated successfully!" : "Service created successfully!");
      await renderOfficerServices();
      await populateApplyServiceSelect();
      $("#officer-service-form").reset();
      $("#service-id").value = "";
    } catch (err) {
      Toast.error("Failed to save service. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("gp-btn--loading");
    }
  });

  $("#service-reset").addEventListener("click", () => {
    $("#officer-service-form").reset();
    $("#service-id").value = "";
  });

  // Delegated actions for edit/delete
  $("#officer-services-list").addEventListener("click", async (e) => {
    const editId = e.target.dataset.editService;
    const deleteId = e.target.dataset.deleteService;

    if (editId) {
      const services = await getServices();
      const s = services.find((x) => x.id === editId);
      if (s) {
        $("#service-id").value = s.id;
        $("#service-name").value = s.name;
        $("#service-category").value = s.category;
        $("#service-description").value = s.description;
      }
    }

    if (deleteId) {
      if (confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
        try {
          await deleteService(deleteId);
          Toast.success("Service deleted successfully");
          await renderOfficerServices();
          await populateApplyServiceSelect();
        } catch (err) {
          Toast.error("Failed to delete service. Please try again.");
        }
      }
    }
  });
}

// Officer & Staff: update application status
function bindApplicationStatusUpdates() {
  const handler = async (e) => {
    const appId = e.target.dataset.app;
    const status = e.target.dataset.status;
    if (!appId || !status) return;

    try {
      await updateApplicationStatus(appId, status);
      await renderAllApplicationsForOfficer();
      await renderStaffApplications();
      if (currentUser?.role === "user") {
        await renderUserApplications();
      }
    } catch (err) {
      Toast.error("Failed to update application status. Please try again.");
      appLogger.error("Failed to update application status", {
        appId,
        status,
        error: err.message,
      });
    }
  };

  $("#officer-applications-list").addEventListener("click", handler);
  $("#staff-applications-list").addEventListener("click", handler);
}

// INIT

function initTabs() {
  $all(".gp-tabs").forEach((tabsContainer) => {
    tabsContainer.addEventListener("click", (e) => {
      if (!e.target.classList.contains("gp-tab")) return;
      const group = tabsContainer.dataset.tabs;
      const tabId = e.target.dataset.tab;
      switchTab(group, tabId);
    });
  });
}

function initNavButtons() {
  $all("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetView = btn.dataset.view;
      switchView(targetView);
    });
  });

  // Mobile menu toggle
  const mobileToggle = $("#mobile-menu-toggle");
  const mobileNav = $("#mobile-nav");
  
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("gp-nav__mobile--open");
      mobileToggle.setAttribute("aria-expanded", isOpen);
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileNav.contains(e.target) && !mobileToggle.contains(e.target)) {
        mobileNav.classList.remove("gp-nav__mobile--open");
        mobileToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
}

// Password visibility toggle
function initPasswordToggles() {
  $all(".gp-password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.parentElement.querySelector("input");
      if (input) {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        toggle.textContent = isPassword ? "🙈" : "👁";
        toggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
      }
    });
  });
}

async function init() {
  $("#footer-year").textContent = new Date().getFullYear();

  $("#login-form").addEventListener("submit", handleLogin);
  $("#register-form").addEventListener("submit", handleRegister);
  $("#user-apply-form").addEventListener("submit", handleUserApply);
  $("#user-profile-form").addEventListener("submit", handleUserProfileUpdate);

  $("#logout-user").addEventListener("click", handleLogout);
  $("#logout-staff").addEventListener("click", handleLogout);
  $("#logout-officer").addEventListener("click", handleLogout);
  
  // Header logout buttons
  const navLogoutBtn = $("#nav-logout-btn");
  const mobileLogoutBtn = $("#mobile-logout-btn");
  if (navLogoutBtn) {
    navLogoutBtn.addEventListener("click", handleLogout);
  }
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", handleLogout);
  }

  // Debounced search
  $("#user-service-search").addEventListener("input", (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      renderServicesForUser(e.target.value);
    }, 300);
  });

  bindOfficerServiceForm();
  bindApplicationStatusUpdates();
  initTabs();
  initNavButtons();
  initPasswordToggles();

  // Initial render
  await renderServicesForUser();
  await populateApplyServiceSelect();
  
  // Initialize navigation buttons (hide logout if not logged in)
  updateNavButtons(null);

  appLogger.info("Frontend initialized");
}

document.addEventListener("DOMContentLoaded", init);