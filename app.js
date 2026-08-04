(function () {
    "use strict";

    const IS_CONFIGURED =
        SUPABASE_URL.startsWith("http") &&
        SUPABASE_ANON_KEY &&
        !SUPABASE_ANON_KEY.includes("YOUR_");

    let supabase = null;
    if (IS_CONFIGURED) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    const $ = (id) => document.getElementById(id);

    const els = {
        authView: $("auth-view"),
        dashboardView: $("dashboard-view"),
        configWarning: $("config-warning"),
        toast: $("toast"),
        tabLogin: $("tab-login"),
        tabSignup: $("tab-signup"),
        tabIndicator: $("tab-indicator"),
        loginFields: $("login-fields"),
        signupFields: $("signup-fields"),
        authForm: $("auth-form"),
        loginEmail: $("login-email"),
        loginPassword: $("login-password"),
        rememberMe: $("remember-me"),
        signupName: $("signup-name"),
        signupEmail: $("signup-email"),
        signupPassword: $("signup-password"),
        passwordMeter: $("password-meter"),
        meterFill: $("meter-fill"),
        meterLabel: $("meter-label"),
        errorBox: $("error-box"),
        submitBtn: $("submit-btn"),
        submitText: $("submit-text"),
        submitSpinner: $("submit-spinner"),
        googleBtn: $("google-btn"),
        forgotLink: $("forgot-link"),
        switchNote: $("switch-note"),
        switchLink: $("switch-link"),
        avatar: $("avatar"),
        dashName: $("dash-name"),
        dashEmail: $("dash-email"),
        welcomeTitle: $("welcome-title"),
        infoUid: $("info-uid"),
        infoEmail: $("info-email"),
        infoCreated: $("info-created"),
        infoLast: $("info-last"),
        signoutBtn: $("signout-btn"),
    };

    let mode = "login";
    let toastTimer = null;

    /* ---------- helpers ---------- */

    function showToast(message, type) {
        clearTimeout(toastTimer);
        els.toast.textContent = message;
        els.toast.className = "toast " + type + " show";
        toastTimer = setTimeout(function () {
            els.toast.className = "toast";
        }, 3800);
    }

    function showError(message) {
        els.errorBox.textContent = message;
        els.errorBox.classList.remove("hidden");
    }

    function clearError() {
        els.errorBox.classList.add("hidden");
        els.errorBox.textContent = "";
    }

    function setLoading(on) {
        els.submitBtn.disabled = on;
        els.submitSpinner.classList.toggle("hidden", !on);
    }

    function setMode(next) {
        mode = next;
        const isLogin = mode === "login";
        els.tabLogin.classList.toggle("active", isLogin);
        els.tabSignup.classList.toggle("active", !isLogin);
        els.tabLogin.setAttribute("aria-selected", String(isLogin));
        els.tabSignup.setAttribute("aria-selected", String(!isLogin));
        els.tabIndicator.classList.toggle("signup", !isLogin);
        els.loginFields.classList.toggle("hidden", !isLogin);
        els.signupFields.classList.toggle("hidden", isLogin);
        els.passwordMeter.classList.toggle("hidden", isLogin);
        els.submitText.textContent = isLogin ? "Sign in" : "Create account";
        els.switchNote.innerHTML = isLogin
            ? "Don't have an account? <button type=\"button\" class=\"link\" id=\"switch-link\">Create one</button>"
            : "Already have an account? <button type=\"button\" class=\"link\" id=\"switch-link\">Sign in</button>";
        els.switchLink = $("switch-link");
        els.switchLink.addEventListener("click", function () {
            setMode(isLogin ? "signup" : "login");
        });
        clearError();
    }

    function markInvalid(input, invalid) {
        input.classList.toggle("invalid", Boolean(invalid));
    }

    function validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function passwordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }

    function updateMeter(password) {
        if (!password) {
            els.meterFill.style.width = "0%";
            els.meterLabel.textContent = "Strength";
            return;
        }
        const score = passwordStrength(password);
        const colors = ["#f87171", "#fb923c", "#facc15", "#a3e635", "#34d399"];
        const labels = ["Weak", "Weak", "Fair", "Good", "Strong", "Strong"];
        const width = Math.max(score * 20, 20);
        els.meterFill.style.width = width + "%";
        els.meterFill.style.background = colors[score];
        els.meterLabel.textContent = labels[score];
        els.meterLabel.style.color = colors[score];
    }

    function formatDate(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function initials(name, email) {
        const source = name && name.trim() ? name : email;
        const parts = source.trim().split(/\s+/);
        const first = parts[0] ? parts[0][0] : "";
        const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
        return (first + last).toUpperCase() || "?";
    }

    /* ---------- auth actions ---------- */

    async function handleSignIn() {
        const email = els.loginEmail.value.trim();
        const password = els.loginPassword.value;

        clearError();
        markInvalid(els.loginEmail, false);
        markInvalid(els.loginPassword, false);

        if (!validateEmail(email)) {
            markInvalid(els.loginEmail, true);
            showError("Please enter a valid email address.");
            return;
        }
        if (!password) {
            markInvalid(els.loginPassword, true);
            showError("Please enter your password.");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;

            if (els.rememberMe.checked) {
                await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });
            }

            showToast("Welcome back, " + (data.user.user_metadata.full_name || email) + "!", "success");
        } catch (err) {
            showError(friendlyError(err));
            showToast("Sign in failed", "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleSignUp() {
        const name = els.signupName.value.trim();
        const email = els.signupEmail.value.trim();
        const password = els.signupPassword.value;

        clearError();
        markInvalid(els.signupName, false);
        markInvalid(els.signupEmail, false);
        markInvalid(els.signupPassword, false);

        if (!name) {
            markInvalid(els.signupName, true);
            showError("Please enter your full name.");
            return;
        }
        if (!validateEmail(email)) {
            markInvalid(els.signupEmail, true);
            showError("Please enter a valid email address.");
            return;
        }
        if (password.length < 8) {
            markInvalid(els.signupPassword, true);
            showError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { full_name: name },
                },
            });
            if (error) throw error;

            const needsConfirm = data.session === null;
            if (needsConfirm) {
                showToast("Check your inbox for a confirmation link.", "info");
                els.authForm.reset();
                setMode("login");
                els.loginEmail.value = email;
            } else {
                showToast("Account created. Welcome!", "success");
            }
        } catch (err) {
            showError(friendlyError(err));
            showToast("Sign up failed", "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleForgotPassword() {
        const email = els.loginEmail.value.trim();
        if (!validateEmail(email)) {
            markInvalid(els.loginEmail, true);
            showToast("Enter your email first.", "error");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            showToast("Password reset link sent to " + email, "info");
        } catch (err) {
            showToast(friendlyError(err), "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin + window.location.pathname },
            });
            if (error) throw error;
        } catch (err) {
            showToast(friendlyError(err), "error");
        }
    }

    function friendlyError(err) {
        const msg = (err && err.message) || "Something went wrong. Try again.";
        const map = {
            "Invalid login credentials": "Incorrect email or password.",
            "Email not confirmed": "Please confirm your email before signing in.",
            "User already registered": "That email is already registered. Try signing in.",
            "Password should be at least 8 characters": "Password must be at least 8 characters.",
            "rate limit": "Too many attempts. Please wait a moment and try again.",
        };
        for (const key in map) {
            if (msg.toLowerCase().includes(key.toLowerCase())) {
                return map[key];
            }
        }
        return msg;
    }

    /* ---------- session handling ---------- */

    function renderSession(user) {
        if (!user) {
            els.dashboardView.classList.add("hidden");
            els.authView.classList.remove("hidden");
            return;
        }

        const meta = user.user_metadata || {};
        const fullName = meta.full_name || "There";
        els.avatar.textContent = initials(fullName, user.email);
        els.dashName.textContent = "Hello, " + fullName + "!";
        els.dashEmail.textContent = user.email;
        els.welcomeTitle.textContent = "Signed in as " + user.email;
        els.infoUid.textContent = user.id;
        els.infoEmail.textContent = user.email;
        els.infoCreated.textContent = formatDate(user.created_at);
        els.infoLast.textContent = formatDate(user.last_sign_in_at);

        els.authView.classList.add("hidden");
        els.dashboardView.classList.remove("hidden");
    }

    async function init() {
        if (!IS_CONFIGURED) {
            els.configWarning.classList.remove("hidden");
            els.submitBtn.disabled = true;
            els.googleBtn.disabled = true;
            return;
        }

        const { data } = await supabase.auth.getSession();
        renderSession(data.session ? data.session.user : null);

        supabase.auth.onAuthStateChange(function (_event, session) {
            renderSession(session ? session.user : null);
        });
    }

    /* ---------- events ---------- */

    els.tabLogin.addEventListener("click", function () {
        setMode("login");
    });
    els.tabSignup.addEventListener("click", function () {
        setMode("signup");
    });
    els.switchLink.addEventListener("click", function () {
        setMode(mode === "login" ? "signup" : "login");
    });

    els.authForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (mode === "login") {
            handleSignIn();
        } else {
            handleSignUp();
        }
    });

    els.forgotLink.addEventListener("click", function (e) {
        e.preventDefault();
        handleForgotPassword();
    });

    els.googleBtn.addEventListener("click", handleGoogle);

    els.signoutBtn.addEventListener("click", async function () {
        try {
            await supabase.auth.signOut();
            showToast("Signed out. See you soon!", "info");
        } catch (err) {
            showToast(friendlyError(err), "error");
        }
    });

    document.querySelectorAll(".toggle-pass").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const target = $(btn.dataset.target);
            const isPassword = target.type === "password";
            target.type = isPassword ? "text" : "password";
            btn.querySelector(".eye").classList.toggle("off", !isPassword);
        });
    });

    [els.loginEmail, els.loginPassword].forEach(function (input) {
        input.addEventListener("input", function () {
            markInvalid(input, false);
            clearError();
        });
    });

    [els.signupName, els.signupEmail, els.signupPassword].forEach(function (input) {
        input.addEventListener("input", function () {
            markInvalid(input, false);
            clearError();
        });
    });

    els.signupPassword.addEventListener("input", function () {
        updateMeter(this.value);
    });

    init();
})();
